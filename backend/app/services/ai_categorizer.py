import re
from typing import Dict

CATEGORY_KEYWORDS = {
    "food": ["restaurant", "pizza", "burger", "coffee", "starbucks", "mcdonalds",
             "uber eats", "doordash", "lunch", "dinner", "breakfast",
             "grocery", "supermarket", "walmart", "food", "eat", "meal", "cafe", "chipotle"],
    "transport": ["uber", "lyft", "taxi", "gas", "fuel", "parking",
                  "bus", "train", "metro", "flight", "airline", "car", "transport"],
    "entertainment": ["netflix", "spotify", "movie", "cinema", "game",
                      "gaming", "playstation", "xbox", "hulu", "disney", "youtube"],
    "shopping": ["amazon", "ebay", "target", "clothes", "shoes", "fashion",
                 "mall", "store", "shop", "buy", "electronics"],
    "bills": ["electric", "electricity", "water", "internet", "wifi", "phone",
              "mobile", "bill", "utility", "subscription", "insurance"],
    "rent": ["rent", "mortgage", "lease", "housing", "apartment", "property"],
    "health": ["doctor", "hospital", "pharmacy", "medicine", "dental",
               "gym", "fitness", "health", "therapy", "clinic"],
    "education": ["school", "college", "university", "course", "udemy",
                  "book", "tuition", "education", "learning"],
    "salary": ["salary", "payroll", "wage", "income", "paycheck"],
    "freelance": ["freelance", "client", "project", "contract", "consulting"],
    "investment": ["stock", "crypto", "bitcoin", "investment", "dividend",
                   "interest", "savings", "trading"]
}

def predict_category(description: str, amount: float = 0) -> Dict:
    description_lower = description.lower().strip()
    scores = {}
    for category, keywords in CATEGORY_KEYWORDS.items():
        score = 0
        matched = []
        for kw in keywords:
            if kw in description_lower:
                score += 2 if re.search(r'\b' + re.escape(kw) + r'\b', description_lower) else 1
                matched.append(kw)
        if score > 0:
            scores[category] = {"score": score, "keywords": matched}
    if not scores:
        return {"category": "other", "confidence": 0.0, "matched_keywords": [], "all_scores": {}}
    best = max(scores, key=lambda x: scores[x]["score"])
    total = sum(s["score"] for s in scores.values())
    conf = scores[best]["score"] / total if total > 0 else 0
    return {"category": best, "confidence": round(min(conf, 1.0), 2),
            "matched_keywords": scores[best]["keywords"],
            "all_scores": {k: v["score"] for k, v in scores.items()}}

def get_model_metrics() -> Dict:
    if _ml_metrics:
        return _ml_metrics
    return {"error": "Model not trained yet. Run: python -m app.services.ml_trainer"}