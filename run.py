import subprocess
import os
import platform


def run_processes():
    project_root = os.path.dirname(os.path.abspath(__file__))
    venv_unix = os.path.join(project_root, "venv", "bin", "activate")
    venv_win = os.path.join(project_root, "venv", "Scripts", "activate")

    # Pick correct activation
    if platform.system() == "Windows":
        if not os.path.exists(venv_win):
            print("❌ Virtual environment not found. Run setup.py first.")
            return
        activate_cmd = f"{venv_win} &&"
        shell_exe = "cmd.exe"
        shell_flag = "/c"
    else:
        if not os.path.exists(venv_unix):
            print("❌ Virtual environment not found. Run setup.py first.")
            return
        activate_cmd = f"source {venv_unix} &&"
        shell_exe = "bash"
        shell_flag = "-c"

    try:
        # Start FastAPI (background)
        print("🚀 Starting FastAPI backend...")
        fastapi_cmd = f"{activate_cmd} uvicorn api.main:app --reload --port 8000"
        fastapi = subprocess.Popen(
            [shell_exe, shell_flag, fastapi_cmd],
            cwd=project_root,
        )

        # Start Next.js (blocking)
        print("⚡ Starting Next.js frontend...")
        next_cmd = f"{activate_cmd} npm run dev"
        subprocess.run(
            [shell_exe, shell_flag, next_cmd],
            cwd=project_root,
        )

    finally:
        # Cleanup FastAPI when Next.js stops
        print("🛑 Stopping FastAPI backend...")
        fastapi.terminate() # type: ignore


if __name__ == "__main__":
    run_processes()
