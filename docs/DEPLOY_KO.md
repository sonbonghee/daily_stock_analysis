# 한국어 AI 주식 분석 — Coolify 운영

이 버전은 ZhuLinsen/daily_stock_analysis의 MIT 라이선스를 유지하며 한국어 화면과 한국어 분석 보고서를 제공합니다. 원본의 중국어·영어 화면도 언어 버튼으로 선택할 수 있습니다.

## 배포 주소

- 서비스: https://stocks.airquiz.kr
- Coolify 프로젝트: `daily-stock-analysis-ko` / `production`
- 원본 기준: `3acb2c5b585cc038bad7ed3fcdb9a7f898667ff0`
- 한국어 수정 소스: https://github.com/sonbonghee/daily_stock_analysis . 현재 Coolify는 검증한 Dockerfile 패키지로 배포하며 GitHub 푸시가 자동 배포를 실행하지 않습니다.

## 실행과 데이터

- Dockerfile: `docker/Dockerfile`, 내부 포트: `8000`.
- 기본 명령: `python bootstrap-ko.py` → 원본의 `main.py --serve-only`.
- Docker 빌드는 `VITE_DEFAULT_UI_LANGUAGE=ko`를 사용합니다. 사용자가 선택한 화면 언어는 브라우저에 저장됩니다.
- 시간대: `Asia/Seoul`. 자동 분석 일정과 외부 알림은 별도로 설정해야 합니다.
- `/app/data`, `/app/logs`, `/app/reports`에 각각 영구 볼륨을 연결합니다.
- 설정은 `/app/data/runtime.env`에 저장되므로 웹에서 저장한 API 키와 종목 목록이 재배포 후에도 남습니다. 동일한 설정을 Coolify 환경변수에 중복 지정하지 마세요.
- 최초 종목 예시: 삼성전자 `005930.KS`, SK하이닉스 `000660.KS`, 애플 `AAPL`.
- `REPORT_LANGUAGE=ko`, `MARKET_REVIEW_REGION=us,kr,jp`로 초기화합니다. 한국 주식은 `.KS`/`.KQ`, 일본 주식은 `.T` 접미사를 포함하세요. [세 시장 사용 안내](MARKETS_KO.md)를 참고하세요.

## 최초 로그인과 모델 설정

처음 실행할 때 관리자 암호가 무작위로 생성되며, 로그나 이미지에 포함되지 않습니다. Coolify의 해당 앱 Terminal에서 아래 명령으로 확인합니다.

```sh
cat /app/data/initial-admin-password.txt
```

HTTPS 사이트에 접속해 이 암호로 로그인한 후 설정에서 원하는 암호로 변경하고 초기 암호 파일을 삭제하세요. 인증 해시와 세션 정보도 데이터 볼륨에 저장됩니다. 손상된 기존 인증 파일을 발견하면 서비스가 시작하지 않도록 구성했습니다.

AI 분석을 사용하려면 설정의 AI 모델 연결에 서비스 제공자, 모델, API 키를 입력하고 연결을 테스트하세요. 원본은 OpenAI 호환 모델과 여러 제공자를 지원합니다. 서버 빌드 성공만으로 AI 모델이나 주가 공급자의 정상 응답이 보장되지는 않습니다. API 키는 소스 저장소나 대화에 넣지 않습니다.

## GitHub 로그인 없이 Coolify에서 빌드

```sh
python3 scripts/package_coolify_ko.py
```

생성되는 `artifacts/Coolify.ko.Dockerfile`은 원본의 정확한 커밋 아카이브를 내려받고, 검토한 로컬 수정 파일을 압축한 오버레이를 적용한 뒤 기존 다단계 빌드를 실행합니다. Coolify의 **Dockerfile (without Git)** 입력란에 전체 내용을 넣습니다. 로컬 파일 경로나 Mac의 HTTP 서버에 의존하지 않습니다.

이 산출물은 배포 패키지이며 GitHub의 자동 업데이트를 추적하지 않습니다. 업데이트할 때 원본 변경을 검토하고 한국어 수정본을 다시 검증한 후 패키지를 다시 생성합니다. 새 GitHub 저장소에 올리는 경우에는 일반 Dockerfile 방식도 사용할 수 있습니다.

## 검증과 복구

```sh
cd apps/dsa-web
npm ci
npm run lint
npm run build
npm test -- src/contexts/__tests__/UiLanguageContext.test.tsx src/i18n/ko.test.ts
```

`/api/health`가 200을 반환하고 Coolify에서 healthy인지 확인합니다. 로그인하지 않은 상태에서는 관리 API가 인증을 요구해야 합니다. 새 분석 보고서가 한국어인지 확인하는 것은 모델 연결 후 진행합니다.

재배포 전에 `/app/data`를 백업합니다. 되돌리려면 이전 Dockerfile/이미지로 배포하되 영구 볼륨은 유지합니다. 데이터베이스 형식이 바뀐 업스트림 업데이트는 대응하는 데이터 백업도 함께 복원해야 합니다. 볼륨 삭제 옵션은 사용하지 않습니다.

원본 중문·영문 README는 원본 프로젝트 설명으로 유지했습니다. 한국어 운영 방식의 차이는 이 문서에 기록합니다.
