"""
Violation workflow helper.
Determines severity and whether to escalate based on violation count.
"""
from config import MAX_WARNINGS_BEFORE_SUBMIT


def get_violation_severity(violation_count: int) -> str:
    """
    Returns 'warning', 'escalated', or 'breach' based on count.
    - count 1      → warning  (show popup, continue)
    - count 2      → warning  (escalate, notify staff)
    - count 3      → warning  (final warning)
    - count >= 4   → breach   (auto-submit)
    """
    if violation_count >= MAX_WARNINGS_BEFORE_SUBMIT:
        return "breach"
    return "warning"


def should_auto_submit(violation_count: int) -> bool:
    return violation_count >= MAX_WARNINGS_BEFORE_SUBMIT


def build_violation_event(
    exam_id: str,
    student_id: str,
    student_name: str,
    violation_type: str,
    violation_count: int,
    evidence: str = "",
    risk_score: int = 0,
) -> dict:
    severity = get_violation_severity(violation_count)
    return {
        "examId":       exam_id,
        "studentId":    student_id,
        "studentName":  student_name,
        "type":         violation_type,
        "severity":     severity,
        "count":        violation_count,
        "autoSubmit":   should_auto_submit(violation_count),
        "evidence":     evidence,
        "riskScore":    risk_score,
    }
