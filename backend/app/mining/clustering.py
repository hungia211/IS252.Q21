import numpy as np
import pandas as pd
from typing import Any, Dict, List, Tuple

class KMeansClustering:
    def __init__(self, k: int, max_iters: int = 100, random_state: int = 42):
        self.k = k
        self.max_iters = max_iters
        self.random_state = random_state

    def _initialize_centroids(self, data: np.ndarray) -> np.ndarray:
        np.random.seed(self.random_state)
        indices = np.random.choice(data.shape[0], self.k, replace=False)
        return data[indices]

    def _assign_clusters(self, data: np.ndarray, centroids: np.ndarray) -> Tuple[np.ndarray, float]:
        distances = np.linalg.norm(data[:, np.newaxis] - centroids, axis=2)
        labels = np.argmin(distances, axis=1)
        min_distances = np.min(distances, axis=1)
        error = np.sum(min_distances ** 2)
        return labels, float(error)

    def _update_centroids(self, data: np.ndarray, labels: np.ndarray) -> np.ndarray:
        new_centroids = np.zeros((self.k, data.shape[1]))
        for i in range(self.k):
            cluster_points = data[labels == i]
            if len(cluster_points) > 0:
                new_centroids[i] = np.mean(cluster_points, axis=0)
        return new_centroids

    def run(self, df: pd.DataFrame) -> Dict[str, Any]:
        data = df.to_numpy(dtype=float)
        centroids = self._initialize_centroids(data)
        iterations_detail = []
        labels = np.zeros(data.shape[0])

        for iteration in range(self.max_iters):
            labels, error = self._assign_clusters(data, centroids)
            iterations_detail.append({
                "iteration": iteration + 1,
                "centroids": centroids.tolist(),
                "partition_matrix": labels.tolist(),
                "error": error
            })
            new_centroids = self._update_centroids(data, labels)
            if np.allclose(centroids, new_centroids):
                break
            centroids = new_centroids

        cluster_info = []
        for i in range(self.k):
            points_in_cluster = data[labels == i].tolist()
            cluster_info.append({
                "cluster_id": i,
                "centroid": centroids[i].tolist(),
                "points": points_in_cluster
            })

        return {
            "graph_data": cluster_info,
            "cluster_info": cluster_info,
            "iterations": iterations_detail
        }


class KohonenNetwork:
    # Thiết lập các giá trị mặc định cho Epochs và Learning Rate
    DEFAULT_EPOCHS = 100
    DEFAULT_LR = 0.5

    def __init__(self, rows: int, cols: int):
        self.rows = rows
        self.cols = cols
        # Sử dụng các giá trị mặc định bên trong logic
        self.epochs = self.DEFAULT_EPOCHS
        self.initial_lr = self.DEFAULT_LR

    def _initialize_weights(self, num_features: int, data: np.ndarray) -> np.ndarray:
        min_vals = np.min(data, axis=0)
        max_vals = np.max(data, axis=0)
        return np.random.uniform(min_vals, max_vals, (self.rows, self.cols, num_features))

    def _find_bmu(self, x: np.ndarray, weights: np.ndarray) -> Tuple[Tuple[int, int], float]:
        distances = np.linalg.norm(weights - x, axis=2)
        bmu_idx = np.unravel_index(np.argmin(distances), distances.shape)
        return bmu_idx, float(distances[bmu_idx])

    def _update_weights(self, x: np.ndarray, weights: np.ndarray, bmu_idx: Tuple[int, int], lr: float, radius: float):
        for r in range(self.rows):
            for c in range(self.cols):
                dist_to_bmu = np.linalg.norm(np.array([r, c]) - np.array(bmu_idx))
                if dist_to_bmu <= radius:
                    influence = np.exp(-(dist_to_bmu**2) / (2 * (radius**2)))
                    weights[r, c, :] += lr * influence * (x - weights[r, c, :])

    def run(self, df: pd.DataFrame) -> Dict[str, Any]:
        data = df.to_numpy(dtype=float)
        num_features = data.shape[1]
        weights = self._initialize_weights(num_features, data)
        
        initial_radius = max(self.rows, self.cols) / 2.0
        time_constant = self.epochs / np.log(initial_radius) if initial_radius > 1 else 1

        for epoch in range(self.epochs):
            radius = initial_radius * np.exp(-epoch / time_constant)
            lr = self.initial_lr * np.exp(-epoch / self.epochs)
            for x in data:
                bmu_idx, _ = self._find_bmu(x, weights)
                self._update_weights(x, weights, bmu_idx, lr, radius)

        winning_info = []
        distance_table = []
        for x in data:
            bmu_idx, min_dist = self._find_bmu(x, weights)
            winning_weight = weights[bmu_idx]
            
            winning_info.append({
                "input_vector": x.tolist(),
                "winning_vector": winning_weight.tolist(),
                "winning_neuron": [int(bmu_idx[0]), int(bmu_idx[1])],
                "min_distance": min_dist
            })
            
            distance_table.append({
                "vector": x.tolist(),
                "distance_to_centroid": min_dist,
                "neuron_position": [int(bmu_idx[0]), int(bmu_idx[1])]
            })

        grid_data = []
        for r in range(self.rows):
            for c in range(self.cols):
                grid_data.append({
                    "row": r, "col": c,
                    "weight_vector": weights[r, c, :].tolist()
                })

        return {
            "winning_info": winning_info,
            "graph_data": {
                "grid_dimensions": {"rows": self.rows, "cols": self.cols},
                "neurons": grid_data
            },
            "distance_table": distance_table
        }