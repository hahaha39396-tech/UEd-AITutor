# grade.py
import subprocess, json, os

def run_code(code_file, input_data):
    try:
        result = subprocess.run(
            ["python", code_file],
            input=input_data.encode(),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=3
        )
        return result.stdout.decode().strip()
    except Exception as e:
        return f"Error: {e}"

def grade_submission(code_file, problem_file="problems/factorial.json"):
    if not os.path.exists(problem_file):
        return 0, 0, ["Problem file not found!"]

    with open(problem_file, encoding="utf-8") as f:
        problem = json.load(f)

    score = 0
    feedback = []

    for case in problem["test_cases"]:
        output = run_code(code_file, case["input"])
        if output == case["output"]:
            score += 1
        else:
            feedback.append(f"Input {case['input']} → expected {case['output']}, got {output}")

    return score, len(problem["test_cases"]), feedback
