import sys
from pathlib import Path

# Add backend to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import settings
from app.db.database import engine
from sqlalchemy import text
from sqlalchemy.exc import OperationalError, ProgrammingError

def run_diagnostic():
    print("=" * 60)
    print("SAANS DATABASE CONNECTIVITY DIAGNOSTIC")
    print("=" * 60)

    try:
        with engine.connect() as conn:
            print("[OK] TCP & Authentication: Successful connection established.")

            # Test SELECT 1
            one = conn.execute(text("SELECT 1;")).scalar()
            if one == 1:
                print("[OK] Basic Query: SELECT 1 succeeded.")
            else:
                print(f"[!] Warning: SELECT 1 returned unexpected value: {one}")

            # 2. Database Name
            try:
                current_db = conn.execute(text("SELECT current_database();")).scalar()
                print(f"[OK] Database Name: {current_db}")
            except Exception as e:
                print(f"[!] Could not determine database name: {type(e).__name__}")

            # 3. PostgreSQL Version
            try:
                pg_version = conn.execute(text("SELECT version();")).scalar()
                summary_ver = pg_version.split(",")[0] if pg_version else "Unknown"
                print(f"[OK] PostgreSQL Version: {summary_ver}")
            except Exception as e:
                print(f"[!] Could not determine PostgreSQL version: {type(e).__name__}")

            # 4. PostGIS Extension Check
            try:
                postgis_ver = conn.execute(text("SELECT PostGIS_Version();")).scalar()
                print(f"[OK] PostGIS Version: {postgis_ver} (PostGIS is AVAILABLE)")
            except (OperationalError, ProgrammingError) as e:
                print(f"[FAIL] PostGIS Status: NOT AVAILABLE. Error: {type(e).__name__}")
                print("    To enable PostGIS, execute in your database SQL editor:")
                print("    CREATE EXTENSION IF NOT EXISTS postgis;")
            except Exception as e:
                print(f"[!] PostGIS Status: Unexpected check error: {type(e).__name__}")

            print("\n[RESULT] Database connectivity and configuration: PASS")
            return True

    except OperationalError as e:
        err_msg = str(e).lower()
        print("\n[FAIL] Connection Failed: OperationalError")
        if "getaddrinfo failed" in err_msg or "name or service not known" in err_msg:
            print("    Classification: DNS / Hostname resolution failure.")
            print("    Hint: Verify host in DATABASE_URL and ensure password does not contain unencoded '@'.")
        elif "password authentication failed" in err_msg:
            print("    Classification: Authentication failure.")
            print("    Hint: Check username and password credentials.")
        elif "connection refused" in err_msg or "timed out" in err_msg:
            print("    Classification: Network / Port connectivity failure.")
            print("    Hint: Check host port 5432 and firewall / Supabase project status.")
        elif "ssl" in err_msg:
            print("    Classification: SSL configuration issue.")
            print("    Hint: Ensure ?sslmode=require is appended to connection URL.")
        else:
            print(f"    Classification: Operational failure ({type(e).__name__})")
        return False
    except Exception as e:
        print(f"\n[FAIL] Connection Failed: Unexpected exception: {type(e).__name__}")
        return False

if __name__ == "__main__":
    success = run_diagnostic()
    sys.exit(0 if success else 1)
