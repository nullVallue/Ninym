from storage import MessageStore


class InMemoryMessageStore(MessageStore):
    def __init__(self):
        self._sessions: dict[str, list[dict]] = {}

    def get_messages(self, session_id: str) -> list[dict]:
        return self._sessions.get(session_id, [])

    def add_message(self, session_id: str, role: str, content: str) -> list[dict]:
        if session_id not in self._sessions:
            self._sessions[session_id] = []

        self._sessions[session_id].append({"role": role, "content": content})

        return self._sessions[session_id]

    def clear_session(self, session_id: str) -> None:
        self._sessions.pop(session_id, None)
