import os
import sys
import subprocess
import venv
from pathlib import Path

REPO_URL = "https://github.com/Georgefemiwise/Acdnsys.git"


def run_cmd(cmd, cwd=None):
    """Run a shell command with live output"""
    result = subprocess.run(cmd, cwd=cwd, shell=True)
    if result.returncode != 0:
        sys.exit(result.returncode)


def main():
    repo_name = Path(REPO_URL).stem.replace(".git", "")

    # ---- Clone or update repo ----
    if not Path(repo_name).exists():
        print(f"Cloning {REPO_URL} ...")
        run_cmd(f"git clone {REPO_URL}")
    else:
        print("Repo already exists, pulling latest changes...")
        run_cmd("git pull", cwd=repo_name)

    project_dir = Path(repo_name)

    # ---- Setup FastAPI (Python backend) ----
    print("\n=== Checking FastAPI Setup ===")
    venv_dir = project_dir / "venv"

    if not venv_dir.exists():
        print("Creating virtual environment...")
        venv.EnvBuilder(with_pip=True).create(venv_dir)

    if os.name == "nt":  # Windows
        pip = venv_dir / "Scripts" / "pip"
        python = venv_dir / "Scripts" / "python"
    else:  # Linux/Mac
        pip = venv_dir / "bin" / "pip"
        python = venv_dir / "bin" / "python"

    reqs = project_dir / "requirements.txt"
    if reqs.exists():
        print("Ensuring Python dependencies are installed...")
        run_cmd(f"{pip} install -r requirements.txt", cwd=project_dir)
    else:
        print("⚠️ No requirements.txt found, installing FastAPI & Uvicorn...")
        run_cmd(f"{pip} install fastapi uvicorn", cwd=project_dir)

    # ---- Setup Next.js (Node frontend) ----
    print("\n=== Checking Next.js Setup ===")
    if (project_dir / "package.json").exists():
        node_modules = project_dir / "node_modules"
        if not node_modules.exists():
            print("Installing Node.js dependencies...")
            run_cmd("npm install", cwd=project_dir)
        else:
            print("Node modules already installed. Running npm update...")
            run_cmd("npm update", cwd=project_dir)
    else:
        print("⚠️ No package.json found. Skipping Next.js setup.")

    # ---- Run backend then frontend ----
    print("\n=== Running Applications ===")
    processes = []

    api_dir = project_dir / "api"
    entry_file = None
    for candidate in ["main.py", "app.py"]:
        if (api_dir / candidate).exists():
            entry_file = candidate
            break

    if entry_file:
        print(f"Starting FastAPI app ({entry_file}) on port 8000...")
        processes.append(
            subprocess.Popen(
                f"{python} -m uvicorn {entry_file.replace('.py','')}:app --reload --port 8000",
                shell=True,
                cwd=api_dir,
            )
        )

    if (project_dir / "package.json").exists():
        print("Starting Next.js frontend on port 3000...")
        processes.append(subprocess.Popen("npm run dev", shell=True, cwd=project_dir))

    if not processes:
        print("❌ No apps found to run.")
        return

    print("\n✅ Both FastAPI (backend:8000) & Next.js (frontend:3000) are running 🚀")
    print("   Open http://localhost:3000 in your browser.")

    try:
        for p in processes:
            p.wait()
    except KeyboardInterrupt:
        print("\nStopping apps...")
        for p in processes:
            p.terminate()


if __name__ == "__main__":
    main()
