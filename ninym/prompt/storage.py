from abc import ABC, abstractmethod


class MessageStore(ABC):
    @abstractmethod
    def get_messages(self, session_id: str) -> list[dict]:
        pass

    @abstractmethod
    def add_message(self, session_id: str, role: str, content: str) -> list[dict]:
        pass

    @abstractmethod
    def clear_session(self, session_id: str) -> None:
        pass
