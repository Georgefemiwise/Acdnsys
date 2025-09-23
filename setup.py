#!/usr/bin/env python3
"""
Setup script for Acdnsys - Vehicle Detection & License Plate Recognition System
This script handles the complete setup of the development environment including:
- Virtual environment creation
- Python dependencies installation
- Node.js dependencies installation
- Environment configuration
- Database initialization
"""

import subprocess
import os
import platform
import sys
import shutil
from pathlib import Path


def run_command(command, cwd=None, shell=False):
    """Execute a command and handle errors gracefully"""
    try:
        if shell or platform.system() == "Windows":
            result = subprocess.run(command, shell=True, cwd=cwd, check=True, 
                                  capture_output=True, text=True)
        else:
            result = subprocess.run(command.split(), cwd=cwd, check=True, 
                                  capture_output=True, text=True)
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running command: {command}")
        print(f"Error output: {e.stderr}")
        return None


def check_prerequisites():
    """Check if required tools are installed"""
    print("🔍 Checking prerequisites...")
    
    # Check Python
    try:
        python_version = subprocess.check_output([sys.executable, "--version"], text=True)
        print(f"✅ Python: {python_version.strip()}")
    except:
        print("❌ Python not found")
        return False
    
    # Check Node.js
    try:
        node_version = subprocess.check_output(["node", "--version"], text=True)
        print(f"✅ Node.js: {node_version.strip()}")
    except:
        print("❌ Node.js not found. Please install Node.js from https://nodejs.org/")
        return False
    
    # Check npm
    try:
        npm_version = subprocess.check_output(["npm", "--version"], text=True)
        print(f"✅ npm: {npm_version.strip()}")
    except:
        print("❌ npm not found")
        return False
    
    return True


def setup_python_environment():
    """Set up Python virtual environment and install dependencies"""
    print("\n🐍 Setting up Python environment...")
    
    project_root = Path(__file__).parent
    venv_path = project_root / "venv"
    
    # Create virtual environment
    if not venv_path.exists():
        print("Creating virtual environment...")
        result = run_command(f"{sys.executable} -m venv venv", cwd=project_root)
        if result is None:
            return False
    else:
        print("Virtual environment already exists")
    
    # Determine activation command based on OS
    if platform.system() == "Windows":
        activate_cmd = str(venv_path / "Scripts" / "activate")
        pip_cmd = str(venv_path / "Scripts" / "pip")
    else:
        activate_cmd = f"source {venv_path / 'bin' / 'activate'}"
        pip_cmd = str(venv_path / "bin" / "pip")
    
    # Install Python dependencies
    print("Installing Python dependencies...")
    requirements_file = project_root / "requirements.txt"
    if requirements_file.exists():
        if platform.system() == "Windows":
            cmd = f"{pip_cmd} install -r requirements.txt"
        else:
            cmd = f"{activate_cmd} && pip install -r requirements.txt"
        
        result = run_command(cmd, cwd=project_root, shell=True)
        if result is None:
            return False
        print("✅ Python dependencies installed")
    else:
        print("⚠️ requirements.txt not found, skipping Python dependencies")
    
    return True


def setup_node_environment():
    """Set up Node.js environment and install dependencies"""
    print("\n📦 Setting up Node.js environment...")
    
    project_root = Path(__file__).parent
    
    # Install Node.js dependencies
    if (project_root / "package.json").exists():
        print("Installing Node.js dependencies...")
        result = run_command("npm install", cwd=project_root)
        if result is None:
            return False
        print("✅ Node.js dependencies installed")
    else:
        print("⚠️ package.json not found, skipping Node.js dependencies")
    
    return True


def setup_environment_file():
    """Create environment file from example"""
    print("\n🔧 Setting up environment configuration...")
    
    project_root = Path(__file__).parent
    env_example = project_root / ".env.example"
    env_file = project_root / ".env"
    
    if env_example.exists() and not env_file.exists():
        shutil.copy(env_example, env_file)
        print("✅ Created .env file from .env.example")
        print("⚠️  Please edit .env file and add your API keys:")
        print("   - ROBOFLOW_API_KEY: Get from https://roboflow.com")
        print("   - ARKESEL_API_KEY: Get from https://sms.arkesel.com")
    elif env_file.exists():
        print("✅ .env file already exists")
    else:
        print("⚠️ .env.example not found, skipping environment setup")
    
    return True


def initialize_database():
    """Initialize the database with sample data"""
    print("\n🗄️ Initializing database...")
    
    try:
        # The database initialization is handled automatically by the FastAPI app
        # when it starts, so we just need to ensure the directory exists
        project_root = Path(__file__).parent
        api_dir = project_root / "api"
        if api_dir.exists():
            print("✅ Database will be initialized on first API startup")
        else:
            print("⚠️ API directory not found")
        return True
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False


def print_next_steps():
    """Print instructions for next steps"""
    print("\n🎉 Setup completed successfully!")
    print("\n📋 Next steps:")
    print("1. Edit the .env file and add your API keys")
    print("2. Start the development servers:")
    print("   • Run: python run.py")
    print("   • Or manually:")
    print("     - Backend: uvicorn api.main:app --reload --port 8000")
    print("     - Frontend: npm run dev")
    print("\n🌐 Access points:")
    print("   • Frontend: http://localhost:3000")
    print("   • Backend API: http://localhost:8000")
    print("   • API Documentation: http://localhost:8000/docs")
    print("\n📚 Features:")
    print("   • Camera capture and plate detection")
    print("   • User and plate management")
    print("   • SMS notifications for matches")
    print("   • Real-time detection dashboard")


def main():
    """Main setup function"""
    print("🚀 Acdnsys Setup - Vehicle Detection & License Plate Recognition System")
    print("=" * 70)
    
    # Check prerequisites
    if not check_prerequisites():
        print("\n❌ Prerequisites check failed. Please install missing tools.")
        sys.exit(1)
    
    # Setup Python environment
    if not setup_python_environment():
        print("\n❌ Python environment setup failed.")
        sys.exit(1)
    
    # Setup Node.js environment
    if not setup_node_environment():
        print("\n❌ Node.js environment setup failed.")
        sys.exit(1)
    
    # Setup environment file
    if not setup_environment_file():
        print("\n❌ Environment setup failed.")
        sys.exit(1)
    
    # Initialize database
    if not initialize_database():
        print("\n❌ Database initialization failed.")
        sys.exit(1)
    
    # Print next steps
    print_next_steps()


if __name__ == "__main__":
    main()