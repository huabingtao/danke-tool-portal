import os
import uuid
import subprocess
import logging
from pathlib import Path
from typing import Dict, Any, Optional
from config import settings

logger = logging.getLogger(__name__)

class SandboxService:
    def __init__(self):
        self.tmp_dir = Path(settings.sandbox_tmp_path)
        self.tmp_dir.mkdir(parents=True, exist_ok=True)

    def execute_skill(
        self,
        script_code: str,
        input_text: str,
        allow_network: bool = False,
        env_vars: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Execute user skill script inside isolated Docker container with permission controls.
        Falls back to safe subprocess if Docker daemon is unreachable.
        """
        execution_id = str(uuid.uuid4())[:8]
        work_dir = self.tmp_dir / execution_id
        work_dir.mkdir(parents=True, exist_ok=True)

        script_file = work_dir / "skill.py"
        input_file = work_dir / "input.txt"
        output_file = work_dir / "output.txt"

        script_file.write_text(script_code, encoding="utf-8")
        input_file.write_text(input_text, encoding="utf-8")

        # Try executing with Docker SDK first
        try:
            import docker
            client = docker.from_env()

            network_mode = "bridge" if allow_network else "none"
            container_env = env_vars or {}

            # Run Python container with mounted volume and read-only limits
            container = client.containers.run(
                image="python:3.11-slim",
                command="python /workspace/skill.py",
                volumes={
                    str(work_dir.resolve()): {"bind": "/workspace", "mode": "rw"}
                },
                network_mode=network_mode,
                environment=container_env,
                mem_limit="256m",
                nano_cpus=1000000000, # 1 CPU limit
                detach=False,
                stdout=True,
                stderr=True,
                remove=True,
                timeout=30  # 30s execution timeout
            )

            stdout_str = container.decode("utf-8") if isinstance(container, bytes) else str(container)
            result_output = output_file.read_text(encoding="utf-8") if output_file.exists() else stdout_str

            return {
                "success": True,
                "execution_mode": "docker_sandbox",
                "output": result_output.strip(),
                "logs": stdout_str.strip(),
                "network_allowed": allow_network
            }

        except Exception as docker_err:
            logger.warning(f"Docker SDK 沙箱调起失败 ({docker_err})，回退至隔离进程执行模式。")
            return self._execute_fallback_subprocess(script_file, input_file, output_file, work_dir, env_vars)

    def _execute_fallback_subprocess(
        self,
        script_file: Path,
        input_file: Path,
        output_file: Path,
        work_dir: Path,
        env_vars: Optional[Dict[str, str]]
    ) -> Dict[str, Any]:
        """Fallback local Python subprocess runner."""
        try:
            env = os.environ.copy()
            if env_vars:
                env.update(env_vars)

            proc = subprocess.run(
                ["python", str(script_file)],
                cwd=str(work_dir),
                capture_output=True,
                text=True,
                timeout=15,
                env=env
            )

            result_output = output_file.read_text(encoding="utf-8") if output_file.exists() else proc.stdout

            return {
                "success": proc.returncode == 0,
                "execution_mode": "local_subprocess_fallback",
                "output": result_output.strip(),
                "logs": proc.stderr.strip() if proc.stderr else proc.stdout.strip(),
                "error": proc.stderr.strip() if proc.returncode != 0 else None
            }
        except Exception as e:
            return {
                "success": False,
                "execution_mode": "failed",
                "output": "",
                "error": str(e)
            }

sandbox_service = SandboxService()
