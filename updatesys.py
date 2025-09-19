import subprocess
import os
import platform


def update_system():
    project_root = os.path.dirname(os.path.abspath(__file__))
    venv_unix = os.path.join(project_root, "venv", "bin", "activate")
    venv_win = os.path.join(project_root, "venv", "Scripts", "activate")

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

    print("📥 Pulling latest changes...")
    subprocess.run(["git", "pull"], cwd=project_root)

    print("🐍 Updating Python dependencies...")
    subprocess.run(
        [shell_exe, shell_flag, f"{activate_cmd} pip install -r requirements.txt"],
        cwd=project_root,
    )

    print("📦 Updating Node.js dependencies...")
    subprocess.run(
        [shell_exe, shell_flag, f"{activate_cmd} npm install"],
        cwd=project_root,
    )

    print("✅ System update complete!")


if __name__ == "__main__":
    update_system()
