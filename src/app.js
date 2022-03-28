"use strict";

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import randomPos from "./utils";
import "./style.css";

class App {
  constructor() {
    // WebGLRenderer 생성
    this.canvas = document.getElementById("canvas");
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true, // 위신호 제거를 통해 plane(지도)의 모서리 깨짐 현상을 해결했습니다.
    });

    // PerspectiveCamera 생성
    const fov = 45;
    const aspect = 2;
    const near = 0.1;
    const far = 1000;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    this.camera.position.set(0, 60, 0);

    // OrbitControls 생성 (DOMRenderer.domElement 가 위에 포개져 있어서 얘를 이벤트 받는 요소로 지정해야 함.)
    this.controls = new OrbitControls(this.camera, this.canvas);
    this.controls.target.set(0, 0, 0);
    this.controls.update();

    // Scene 생성
    this.scene = new THREE.Scene();

    // TextureLoader 생성
    this.textureLoader = new THREE.TextureLoader();

    // 생성한 마커(Sprite) 들을 담을 배열
    this.markerDatas = [];

    // 지도(이미지)를 입힌 Plane 생성
    {
      const planeSize = 40;
      const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);

      // 다운로드 받은 map.png 텍스처 이미지 원본 사이즈가 2907 * 3460 이었기 때문에
      // Three.js 에 의해 자동으로 2의 거듭제곱 수 2048 * 2048 로 변환되었습니다.
      this.textureLoader.load("./resources/map.png", (texture) => {
        const planeMat = new THREE.MeshBasicMaterial({
          map: texture,
          // side: THREE.DoubleSide,
        });
        const planeMesh = new THREE.Mesh(planeGeo, planeMat);
        planeMesh.rotation.x = Math.PI * -0.5; // plane 을 -90도 회전했습니다.

        this.scene.add(planeMesh);

        // 지도가 로드 및 생성되고 난 뒤에
        // 마커가 생성될 수 있도록 onLoad 함수인자 안에서 호출했습니다.
        this.createMarkers();
      });
    }

    window.addEventListener("resize", this.resize.bind(this), false);
    this.resize();

    requestAnimationFrame(this.animate.bind(this));
  }

  // 랜덤한 개수와 위치의 Marker 생성
  createMarkers() {
    this.textureLoader.load("./resources/marker.png", (texture) => {
      // 마커들이 계속 카메라를 향하도록 Sprite 객체를 활용해 구현했습니다.
      const spriteMat = new THREE.SpriteMaterial({
        map: texture,
      });
      const posY = 0.5; // 각 마커들이 plane 에서 0.5 정도 떠있게 했습니다.

      for (let i = 0; i < 1; i++) {
        const marker = new THREE.Sprite(spriteMat);
        const markerPos = randomPos();

        // sprite 비율이 찌그러진 상태로 렌더되어서
        // 원본 이미지 비율인 118 : 144, 약 1 : 1.22 정도로 맞췄습니다.
        marker.scale.set(1, 1.22, 0);
        marker.position.set(markerPos[0], posY, markerPos[1]);

        const markerAnchor = new THREE.Vector3().add(marker.position);

        const label = document.createElement("div");
        const title = document.createElement("div");
        const content = document.createElement("div");

        label.className = "label";
        title.className = "title";
        title.textContent = "This is label";
        content.className = "content";
        content.textContent =
          "Lorem ipsum dolor, sit amet consectetur adipisicing elit.";

        label.appendChild(title);
        label.appendChild(content);

        this.markerDatas.push({
          markerAnchor: markerAnchor,
          label: label,
        });

        this.scene.add(marker);

        document.body.appendChild(label);

        // 외적벡터 (cross) 시각화
        this.arrow = new THREE.ArrowHelper(
          new THREE.Vector3(0, 0, 0),
          markerAnchor,
          5,
          0xff0000
        );

        // x축 수평벡터 시각화
        this.arrow2 = new THREE.ArrowHelper(
          new THREE.Vector3(1, 0, 0),
          markerAnchor,
          5,
          0x00ff00
        );

        this.scene.add(this.arrow);
        this.scene.add(this.arrow2);
      }
    });
  }

  drawDOM(markerData) {
    const canvas = this.renderer.domElement;

    // 카메라 - 마커 벡터
    const camToMarker = new THREE.Vector3().subVectors(
      markerData.markerAnchor,
      this.camera.position
    );

    // 카메라 - 마커벡터 * x축 수평벡터 외적계산
    const cross = new THREE.Vector3().crossVectors(
      camToMarker,
      new THREE.Vector3(1, 0, 0)
    );

    // 외적벡터 길이 정규화
    cross.normalize(); // 수직인 외적 벡터는 길이가 1임

    let upY = 80;

    // 외적벡터가 아래로 향하면 y좌표값을 더 끌어올림.
    // cross.angleTo(new THREE.Vector3(0,0,1)
    if (cross.y < 0) {
      upY *= 2 - cross.y;
    } else {
      upY *= 1 + cross.y;
    }

    // 외적벡터 시각화 계산
    this.arrow.setDirection(cross); // 외적 벡터를 화살표로 표시하기 위해 direction을 바꿔줌

    // 마커위치에서 외적벡터 더해줌.
    const labelPos = new THREE.Vector3().addVectors(
      markerData.markerAnchor,
      cross
    );

    // 더해준 값을 투영변환
    labelPos.project(this.camera);

    // -1 ~ 1 사이의 좌표값으로 매핑
    const x = (labelPos.x * 0.5 + 0.5) * canvas.clientWidth;
    const y = (labelPos.y * -0.5 + 0.5) * canvas.clientHeight;

    // 2D CSS3D 좌표값으로 할당
    markerData.label.style.transform = `translate(-50%, -50%) translate(${x}px, ${
      y - upY
    }px)`;
  }

  // 브라우저 라시이징 시 해상도 및 카메라 비율 조정
  resize() {
    const canvas = this.renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    this.renderer.setSize(width, height, false);

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  // 드로잉 함수 재귀 호출
  animate() {
    for (let i = 0; i < 10; i++) {
      this.markerDatas.forEach((markerData) => {
        this.drawDOM(markerData);
      });
    }

    this.renderer.render(this.scene, this.camera);

    requestAnimationFrame(this.animate.bind(this));
  }
}

window.onload = () => {
  new App();
};
