# utils/compact_rows.py
def compact_rows_for_prompt(rows: list[dict], max_rows: int = 30, max_val_len: int = 80):
    """
    Produce a compact, CSV-like snippet for the LLM prompt.
    """
    if not rows:
        return "", []

    # headers from the first row
    headers = list(rows[0].keys())
    lines = [",".join(headers)]
    sample = rows[:max_rows]

    for r in sample:
        vals = []
        for h in headers:
            v = r.get(h, "")
            v = "" if v is None else str(v)
            if len(v) > max_val_len:
                v = v[: max_val_len - 3] + "..."
            # escape commas/newlines minimally
            v = v.replace("\n", " ").replace(",", ";")
            vals.append(v)
        lines.append(",".join(vals))

    return "\n".join(lines), headers
