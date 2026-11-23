"""Initialize persistent Korean web configuration before accepting requests."""
import os
import secrets
from pathlib import Path


def initialize():
    os.umask(0o077)
    env_path = Path(os.environ['ENV_FILE'])
    env_path.parent.mkdir(parents=True, exist_ok=True)
    if not env_path.exists():
        with env_path.open('x', encoding='utf-8') as stream:
            stream.write(
                'REPORT_LANGUAGE=ko\n'
                'STOCK_LIST=AAPL,MSFT,005930.KS,000660.KS,7203.T,6758.T\n'
                'MARKET_REVIEW_REGION=us,kr,jp\n'
                'ADMIN_AUTH_ENABLED=true\n'
                'MAX_WORKERS=1\n'
            )
    from src import auth
    credential = Path(os.environ['DATABASE_PATH']).parent / '.admin_password_hash'
    if credential.exists() and not auth.has_stored_password():
        raise RuntimeError('Stored administrator credential is invalid; repair it before startup.')
    if not credential.exists():
        password = secrets.token_urlsafe(24)
        password_path = credential.parent / 'initial-admin-password.txt'
        # Save recovery information before activating the password. Never log it.
        with password_path.open('w', encoding='utf-8') as stream:
            stream.write(password + '\n')
        error = auth.set_initial_password(password)
        if error:
            raise RuntimeError('Unable to initialize administrator credential')
    os.execvp('python', ['python', 'main.py', '--serve-only', '--host', '0.0.0.0',
                         '--port', os.environ.get('API_PORT', '8000')])


if __name__ == '__main__':
    initialize()
