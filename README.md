# Miricanvas Tag SaaS

미리캔버스 기반 분석 기능을 제공하는 Node.js 서버 프로젝트입니다.

현재 제공 기능

- 미리캔버스 요소 메타태그 추출기
- 미리캔버스 템플릿 트렌드 분석기

Notion 저장 기능은 포함하지 않습니다.

## 실행 환경

- Node.js 20 이상
- npm

## 설치

```bash
npm install
```

## `.env` 생성

실행 전에 `.env` 파일을 준비합니다.

```bash
cp .env.example .env
```

PowerShell:

```powershell
Copy-Item .env.example .env
```

또는 직접 `.env` 파일을 만들고 아래 값을 입력합니다.

```env
MIRICANVAS_API_URL=https://api.miricanvas.com/api/element
PORT=3000
DEBUG=false
```

## 환경변수

```env
PORT=3000
MIRICANVAS_API_URL=https://api.miricanvas.com/api/element
DEBUG=false
MIRICANVAS_API_METHOD=GET
MIRICANVAS_API_HEADERS_JSON={}
MIRICANVAS_TEAM_IDX=
TIME_ZONE=Asia/Seoul
```

- `PORT`: 로컬 서버 실행 포트
- `MIRICANVAS_API_URL`: 요소 분석에 사용하는 미리캔버스 API base URL
- `DEBUG`: `true`일 때만 상세 디버그 로그 출력
- `MIRICANVAS_API_METHOD`: 기본값 `GET`
- `MIRICANVAS_API_HEADERS_JSON`: 추가 헤더가 필요할 때 JSON 문자열로 입력
- `MIRICANVAS_TEAM_IDX`: 필요한 경우에만 사용
- `TIME_ZONE`: 수집일 표시에 사용할 시간대

## 로컬 실행

```bash
npm start
```

기본 주소:

- `http://localhost:3000`

## 디버그 모드

상세 API 로그가 필요할 때만 `DEBUG=true`로 실행합니다.

```env
DEBUG=true
```

운영과 배포 환경에서는 기본값 `false` 사용을 권장합니다.

## 주요 경로

- `/`
- `/miricanvas`
- `/miricanvas/tag`
- `/miricanvas/template`
- `/about`
- `/privacy`
- `/terms`
- `/contact`
- `/robots.txt`
- `/sitemap.xml`

레거시 경로는 301 리다이렉트됩니다.

- `/tag` -> `/miricanvas/tag`
- `/template` -> `/miricanvas/template`

## Git 저장소 준비

이 프로젝트는 `.env`와 로컬 배포 폴더가 Git에 올라가지 않도록 `.gitignore`가 포함되어 있습니다.

초기화 예시:

```bash
git init
git add .
git commit -m "Initial commit"
```

GitHub 저장소 연결 예시:

```bash
git branch -M main
git remote add origin https://github.com/USER/REPO.git
git push -u origin main
```

## Vercel 배포

이 프로젝트는 로컬에서는 `node src/server.js`로 실행되고, Vercel에서는 `api/index.js` 엔트리를 통해 같은 핸들러를 사용합니다.

추가된 파일:

- `.gitignore`
- `vercel.json`
- `api/index.js`

### Vercel 배포 순서

1. GitHub에 저장소를 푸시합니다.
2. Vercel에서 `New Project`를 선택합니다.
3. GitHub 저장소를 Import 합니다.
4. Environment Variables에 아래 값을 등록합니다.

```env
MIRICANVAS_API_URL=https://api.miricanvas.com/api/element
DEBUG=false
MIRICANVAS_API_METHOD=GET
MIRICANVAS_API_HEADERS_JSON={}
MIRICANVAS_TEAM_IDX=
TIME_ZONE=Asia/Seoul
```

5. 배포를 실행합니다.

### Vercel 설정

`vercel.json`은 모든 요청을 Vercel Node Function 엔트리로 전달합니다.

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/api/index.js"
    }
  ]
}
```

## 확인 사항

- `.env`는 Git에 포함되지 않습니다.
- `robots.txt`, `sitemap.xml`, 404 페이지는 그대로 동작합니다.
- 로컬 실행과 Vercel 배포가 같은 라우팅 구조를 사용합니다.
