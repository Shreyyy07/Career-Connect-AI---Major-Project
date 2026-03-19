import math
import re
from typing import Iterable


_word_re = re.compile(r"[A-Za-z][A-Za-z0-9+#.\-]{1,}")


def extract_tokens(text: str) -> set[str]:
    tokens = {t.lower() for t in _word_re.findall(text or "")}
    return tokens


def tokenize_words(text: str) -> list[str]:
    """
    Like `extract_tokens`, but keeps duplicates to support TF-IDF.
    """
    return [t.lower() for t in _word_re.findall(text or "")]


def jaccard_similarity(a: Iterable[str], b: Iterable[str]) -> float:
    sa, sb = set(a), set(b)
    if not sa and not sb:
        return 0.0
    inter = len(sa & sb)
    union = len(sa | sb)
    return inter / union if union else 0.0


def clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))


def to_percent01(x: float) -> float:
    return clamp01(x) * 100.0


def stable_hash_score(seed: str) -> float:
    """
    Deterministic pseudo-score in [0, 100] so v1 feels "real" without ML.
    """
    if not seed:
        return 0.0
    h = 0
    for ch in seed:
        h = (h * 131 + ord(ch)) % 1000003
    return float(h % 101)


def tfidf_cosine_score(text_a: str, text_b: str) -> float:
    """
    Lightweight semantic-ish secondary score (acts as Gemini/RAG placeholder in v1).
    Uses TF-IDF cosine similarity on tokenized text.
    Returns a value in [0, 1].
    """
    import math
    from collections import Counter

    tokens_a = tokenize_words(text_a)
    tokens_b = tokenize_words(text_b)

    if not tokens_a or not tokens_b:
        return 0.0

    tf_a = Counter(tokens_a)
    tf_b = Counter(tokens_b)

    terms = set(tf_a.keys()) | set(tf_b.keys())
    n_docs = 2

    # document frequency across two docs
    df = {}
    for t in terms:
        df[t] = (1 if t in tf_a else 0) + (1 if t in tf_b else 0)

    # idf with smoothing
    def idf(term: str) -> float:
        return math.log((n_docs + 1) / (df[term] + 1)) + 1.0

    # build sparse vectors in dict form
    vec_a = {t: tf_a[t] * idf(t) for t in terms if t in tf_a}
    vec_b = {t: tf_b[t] * idf(t) for t in terms if t in tf_b}

    # cosine
    dot = 0.0
    for t, va in vec_a.items():
        vb = vec_b.get(t)
        if vb is not None:
            dot += va * vb

    norm_a = math.sqrt(sum(v * v for v in vec_a.values()))
    norm_b = math.sqrt(sum(v * v for v in vec_b.values()))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return max(0.0, min(1.0, dot / (norm_a * norm_b)))

