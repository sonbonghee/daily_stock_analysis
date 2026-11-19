"""Package runtime changes as a compact, pinned Coolify Dockerfile."""
import base64
import hashlib
import io
import re
import subprocess
import tarfile
import textwrap
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
revision = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
# Diff against the pinned upstream, avoiding duplication of its large locale/docs files.
patch = subprocess.check_output(['git', 'diff', '--binary', 'HEAD', '--', 'apps/dsa-web', 'docker'], cwd=ROOT)
untracked = subprocess.check_output(['git', 'ls-files', '--others', '--exclude-standard', '-z', '--', 'apps/dsa-web', 'docker'], cwd=ROOT).decode().split('\0')
paths = sorted(p for p in untracked if p and '/node_modules/' not in p and '/__pycache__/' not in p)
for p in paths:
    if Path(p).name.startswith('.env') or p.endswith(('.pem', '.key')):
        raise RuntimeError(f'Refusing to package sensitive path: {p}')
archive = io.BytesIO()
with tarfile.open(fileobj=archive, mode='w:xz', preset=9) as tar:
    info = tarfile.TarInfo('korean-localization.patch')
    info.size = len(patch)
    tar.addfile(info, io.BytesIO(patch))
    for p in paths:
        tar.add(ROOT / p, arcname=p)
encoded = textwrap.fill(base64.b64encode(archive.getvalue()).decode(), width=76)
source = f'''FROM alpine:3.21 AS source
RUN apk add --no-cache git xz
ADD https://github.com/ZhuLinsen/daily_stock_analysis/archive/{revision}.tar.gz /tmp/source.tar.gz
RUN mkdir /src && tar -xzf /tmp/source.tar.gz -C /src --strip-components=1
COPY <<KOREAN_SOURCE_OVERLAY /tmp/overlay.b64
{encoded}
KOREAN_SOURCE_OVERLAY
RUN base64 -d /tmp/overlay.b64 | tar -xJf - -C /src && cd /src && git apply --check korean-localization.patch && git apply korean-localization.patch
'''
dockerfile = (ROOT / 'docker/Dockerfile').read_text()
syntax, body = dockerfile.split('\n', 1)
build_revision = revision[:12] + '-ko-' + hashlib.sha256(archive.getvalue()).hexdigest()[:12]
body = body.replace('ARG DSA_WEB_REVISION=unknown', 'ARG DSA_WEB_REVISION=' + build_revision)
body = re.sub(r'^COPY (?!.*--from=)(.+)$', lambda m: 'COPY --from=source ' + ' '.join('/src/' + part for part in m[1].split()[:-1]) + ' ' + m[1].split()[-1], body, flags=re.M)
output = ROOT / 'artifacts/Coolify.ko.Dockerfile'
output.parent.mkdir(exist_ok=True)
content = syntax + '\n' + source + '\n' + body
# Coolify sends this via a base64 shell argument; Linux caps a single argument at 128 KiB.
if len(base64.b64encode(content.encode())) > 120_000:
    raise RuntimeError('Package exceeds the safe Coolify shell argument limit.')
output.write_text(content)
print(f'Upstream: {revision}; overlay: {len(paths)} new files + patch; Dockerfile: {output.stat().st_size} bytes')
