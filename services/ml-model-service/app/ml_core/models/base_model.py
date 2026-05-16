from __future__ import annotations

from abc import ABC, abstractmethod


class BaseRanker(ABC):
    @abstractmethod
    def score(
        self,
        *,
        distance_km: float,
        popular: float,
        tag_similar: float,
    ) -> float:
        raise NotImplementedError
