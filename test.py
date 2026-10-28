from langgraph.graph import StateGraph, START, END, add_messages
from langchain_core.messages import AnyMessage, AIMessage,HumanMessage
from pydantic import BaseModel
from typing import Annotated
from dotenv import load_dotenv
from src.apps.agent.llm import get_model
from langgraph.checkpoint.memory import InMemorySaver
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.types import interrupt,Command
checkpointer = InMemorySaver()


llm = get_model()

load_dotenv()


class State(BaseModel):
    message: Annotated[list, add_messages]


def send_email(state:State, email: str) -> str:
    dicision = interrupt(
        {
            "type":"approval",
            "reason":"For sending email",
            "question":state.message[-1].content,
            "instruction":"Approve this action? yes/no"
        }
    )
    if dicision['approved'] == 'no':
        return {"message"[AIMessage(content="Not approved")]}
    
    return f"email send {email}"


model = llm.bind_tools([send_email])


def chat(state: State) -> dict:
    return model.invoke({"message": [state["message"]]})


graph = StateGraph(State)
graph.add_node("chat", chat)
graph.add_node("tool", ToolNode)
graph.add_edge(START, "chat")
graph.add_conditional_edges("chat", tools_condition)


agent = graph.compile(checkpointer=checkpointer)


config = {"configurable": {"thread_id": 12}}


response =agent.invoke(
    {
        "message":["hello"]
    },config=config
)

response = agent.invoke(
    {"messages": [HumanMessage(content="send a email to anshu@gmail.com send hii ")]},
    config={"configurable": {"thread_id": "12"}}
)
response['messages'][-1].content
