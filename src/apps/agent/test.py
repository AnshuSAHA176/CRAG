hard_evaluation_dataset = [
    {
        "id": "H01",
        "question": (
            "A student borrows six books on Monday. After 10 days, "
            "can they borrow six more books if none have been returned?"
        ),
        "expected_answer": (
            "No. A student member can borrow up to six books at a time "
            "for 21 days. They must return books before borrowing more "
            "if they are already at the borrowing limit."
        ),
        "expected_source": ["01_library_operations.pdf"],
        "answerable": True,
        "type": "multi_fact_reasoning",
    },
   
    {
        "id": "H07",
        "question": (
            "A RAG system retrieves five chunks with high similarity "
            "scores, but none contains evidence for the answer. "
            "Should it answer based on the similarity scores?"
        ),
        "expected_answer": (
            "No. Similarity scores alone do not prove that a chunk "
            "supports a claim. The system should say it does not have "
            "enough information instead of inventing an answer."
        ),
        "expected_source": ["04_rag_system_notes.pdf"],
        "answerable": True,
        "type": "conceptual_reasoning",
    },
    
    {
        "id": "H09",
        "question": (
            "What is the maximum number of books a student can borrow "
            "on Sunday, and what is the library's Sunday opening time?"
        ),
        "expected_answer": (
            "The library is closed on Sundays, so there is no Sunday "
            "opening time. The borrowing policy allows student members "
            "to borrow up to six books at a time, but it does not specify "
            "a special Sunday borrowing limit."
        ),
        "expected_source": ["01_library_operations.pdf"],
        "answerable": True,
        "type": "cross_section_reasoning",
    },
   
]

from .crag import get_agent

agnet=get_agent()

def case():
    for data_set in hard_evaluation_dataset:
        initial_state = {
                "question": data_set['question'],
                "user_id": "38eb703e-35b7-4b7d-b246-c0e37c75595f",
                "chunks": [],
                "context": "",
                "answer": "",
                "retrieval_good": False,
                "grounded": False,
                "retry_count": 0,
                "relevance_score": 0.0,
                "relevance_reason": "",
                "rewritten_question": "",
            }
        result =agnet.invoke(initial_state,config={
                                "configurable": {
                                    "thread_id": "38eb703e-35b7-4b7d-b246-c0e37c75595f",
                                }
                            },)
        print(f"question_num:-{data_set['id']}\n{result['answer']}")
