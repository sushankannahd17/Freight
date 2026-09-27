"""
MLflow integration service for model tracking and registry.
"""

from datetime import datetime
from typing import Any

import mlflow
from mlflow.tracking import MlflowClient

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class MLflowService:
    """Service for MLflow model tracking and registry."""

    def __init__(self):
        """Initialize MLflow service."""
        mlflow.set_tracking_uri(settings.mlflow_tracking_uri)
        self.client = MlflowClient()
        self.experiment_name = settings.mlflow_experiment_name

        # Create experiment if it doesn't exist
        try:
            self.experiment = mlflow.get_experiment_by_name(self.experiment_name)
            if self.experiment is None:
                self.experiment_id = mlflow.create_experiment(self.experiment_name)
                logger.info(f"Created MLflow experiment: {self.experiment_name}")
            else:
                self.experiment_id = self.experiment.experiment_id
                logger.info(f"Using MLflow experiment: {self.experiment_name}")
        except Exception as e:
            logger.error(f"Failed to initialize MLflow experiment: {e}")
            self.experiment_id = None

    def start_run(
        self,
        run_name: str | None = None,
        tags: dict[str, str] | None = None,
    ) -> Any:
        """
        Start a new MLflow run.

        Args:
            run_name: Optional run name
            tags: Optional tags

        Returns:
            Active run context
        """
        try:
            run = mlflow.start_run(
                experiment_id=self.experiment_id,
                run_name=run_name,
                tags=tags,
            )
            logger.info(f"Started MLflow run: {run.info.run_id}")
            return run
        except Exception as e:
            logger.error(f"Failed to start MLflow run: {e}")
            raise

    def log_params(self, params: dict[str, Any]) -> None:
        """Log parameters to current run."""
        try:
            mlflow.log_params(params)
            logger.debug(f"Logged {len(params)} parameters")
        except Exception as e:
            logger.error(f"Failed to log parameters: {e}")

    def log_metrics(
        self,
        metrics: dict[str, float],
        step: int | None = None,
    ) -> None:
        """Log metrics to current run."""
        try:
            mlflow.log_metrics(metrics, step=step)
            logger.debug(f"Logged {len(metrics)} metrics")
        except Exception as e:
            logger.error(f"Failed to log metrics: {e}")

    def log_model(
        self,
        model: Any,
        artifact_path: str,
        registered_model_name: str | None = None,
    ) -> None:
        """
        Log model artifact.

        Args:
            model: Model to log
            artifact_path: Path within run's artifact directory
            registered_model_name: Name for model registry
        """
        try:
            mlflow.sklearn.log_model(
                sk_model=model,
                artifact_path=artifact_path,
                registered_model_name=registered_model_name,
            )
            logger.info(f"Logged model to {artifact_path}")
        except Exception as e:
            logger.error(f"Failed to log model: {e}")

    def log_artifact(self, local_path: str, artifact_path: str | None = None) -> None:
        """Log artifact file."""
        try:
            mlflow.log_artifact(local_path, artifact_path)
            logger.debug(f"Logged artifact: {local_path}")
        except Exception as e:
            logger.error(f"Failed to log artifact: {e}")

    def log_dict(self, dictionary: dict, artifact_file: str) -> None:
        """Log dictionary as JSON artifact."""
        try:
            mlflow.log_dict(dictionary, artifact_file)
            logger.debug(f"Logged dictionary: {artifact_file}")
        except Exception as e:
            logger.error(f"Failed to log dictionary: {e}")

    def end_run(self, status: str = "FINISHED") -> None:
        """End current run."""
        try:
            mlflow.end_run(status=status)
            logger.info(f"Ended MLflow run with status: {status}")
        except Exception as e:
            logger.error(f"Failed to end run: {e}")

    def get_run(self, run_id: str) -> Any:
        """Get run by ID."""
        try:
            return self.client.get_run(run_id)
        except Exception as e:
            logger.error(f"Failed to get run {run_id}: {e}")
            return None

    def search_runs(
        self,
        filter_string: str = "",
        max_results: int = 100,
    ) -> list[Any]:
        """Search runs."""
        try:
            return self.client.search_runs(
                experiment_ids=[self.experiment_id],
                filter_string=filter_string,
                max_results=max_results,
            )
        except Exception as e:
            logger.error(f"Failed to search runs: {e}")
            return []

    def register_model(
        self,
        model_uri: str,
        name: str,
        tags: dict[str, str] | None = None,
    ) -> Any:
        """
        Register model in model registry.

        Args:
            model_uri: URI of model artifact
            name: Model name
            tags: Optional tags

        Returns:
            Registered model version
        """
        try:
            result = mlflow.register_model(model_uri, name, tags=tags)
            logger.info(f"Registered model: {name} version {result.version}")
            return result
        except Exception as e:
            logger.error(f"Failed to register model: {e}")
            return None

    def get_model_version(self, name: str, version: str) -> Any:
        """Get model version from registry."""
        try:
            return self.client.get_model_version(name, version)
        except Exception as e:
            logger.error(f"Failed to get model version: {e}")
            return None

    def transition_model_stage(
        self,
        name: str,
        version: str,
        stage: str,
    ) -> None:
        """
        Transition model to new stage.

        Args:
            name: Model name
            version: Model version
            stage: Target stage (Staging, Production, Archived)
        """
        try:
            self.client.transition_model_version_stage(
                name=name,
                version=version,
                stage=stage,
            )
            logger.info(f"Transitioned {name} v{version} to {stage}")
        except Exception as e:
            logger.error(f"Failed to transition model stage: {e}")
