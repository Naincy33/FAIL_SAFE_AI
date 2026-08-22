import json
import os
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

from groq import Groq
from dotenv import load_dotenv

try:
    from Backend.llm.groq_client import groq_chat_completion
except ModuleNotFoundError:
    from llm.groq_client import groq_chat_completion


# ============================================================
# Environment
# ============================================================

load_dotenv()

BACKEND_DIR = Path(__file__).resolve().parents[1]

TRACES_DIR = BACKEND_DIR / "data" / "traces"
OUTPUT_DIR = BACKEND_DIR / "data" / "classifications"
PROMPT_FILE = BACKEND_DIR / "classifier" / "classifier_prompt.txt"

# Faster default for demo.
# Can still be overridden with GROQ_MODEL in .env
MODEL_NAME = os.environ.get(
    "GROQ_MODEL",
    "openai/gpt-oss-20b",
)

# Keep this moderate to reduce Groq rate-limit risk.
MAX_WORKERS = 4

client = Groq(
    api_key=os.environ.get("GROQ_API_KEY")
)


# ============================================================
# Load classifier prompt
# ============================================================

def load_prompt():
    with PROMPT_FILE.open(
        "r",
        encoding="utf-8",
    ) as file:
        return file.read()


# ============================================================
# Parse JSON robustly
# ============================================================

def parse_json_response(result_text: str) -> dict:
    """
    Parse classifier JSON even if the model adds markdown fences
    or a small amount of surrounding text.
    """

    text = (result_text or "").strip()

    if not text:
        raise ValueError(
            "Classifier returned an empty response."
        )

    # Remove markdown fences.
    if "```json" in text:
        text = text.replace(
            "```json",
            "",
        )

    if "```" in text:
        text = text.replace(
            "```",
            "",
        )

    text = text.strip()

    # First attempt: whole response.
    try:
        parsed = json.loads(text)

        if not isinstance(parsed, dict):
            raise ValueError(
                "Classifier response must be a JSON object."
            )

        return parsed

    except json.JSONDecodeError:
        pass

    # Second attempt: extract JSON object.
    start = text.find("{")
    end = text.rfind("}")

    if start != -1 and end != -1 and end > start:
        candidate = text[start : end + 1]

        try:
            parsed = json.loads(candidate)

            if isinstance(parsed, dict):
                return parsed

        except json.JSONDecodeError:
            pass

    raise ValueError(
        "Classifier did not return valid JSON.\n"
        f"Raw response:\n{text}"
    )


# ============================================================
# Classify one trace
# ============================================================

def classify_trace(trace_file: Path):
    scenario_id = trace_file.stem

    output_file = (
        OUTPUT_DIR / trace_file.name
    )

    # --------------------------------------------------------
    # Skip already-classified scenarios
    # --------------------------------------------------------

    if output_file.exists():

        print(
            f"⏩ {scenario_id} already classified "
            f"- skipping API call"
        )

        return "SKIPPED"

    # --------------------------------------------------------
    # Load trace
    # --------------------------------------------------------

    with trace_file.open(
        "r",
        encoding="utf-8",
    ) as file:

        trace_data = json.load(file)

    prompt = load_prompt()

    classifier_input = f"""
{prompt}

TRACE TO CLASSIFY:

{json.dumps(
    trace_data,
    indent=2,
    ensure_ascii=False,
)}

Return ONLY valid JSON.
""".strip()

    print(
        f"🔍 Classifying {scenario_id}..."
    )

    # --------------------------------------------------------
    # Groq API call
    # --------------------------------------------------------

    response = groq_chat_completion(
        client,
        model=MODEL_NAME,
        messages=[
            {
                "role": "user",
                "content": classifier_input,
            }
        ],
        temperature=0,
    )

    result_text = (
        response.choices[0].message.content or ""
    ).strip()

    # --------------------------------------------------------
    # Parse JSON
    # --------------------------------------------------------

    result = parse_json_response(
        result_text
    )

    # Preserve scenario ID if classifier omitted it.
    result.setdefault(
        "scenario_id",
        scenario_id,
    )

    # --------------------------------------------------------
    # Save classification
    # --------------------------------------------------------

    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    with output_file.open(
        "w",
        encoding="utf-8",
    ) as file:

        json.dump(
            result,
            file,
            indent=2,
            ensure_ascii=False,
        )

    print(
        f"✅ Classified {scenario_id}"
    )

    return "CLASSIFIED"


# ============================================================
# Main
# ============================================================

def main():

    print(
        "🚀 Classifier Starting...\n"
    )

    trace_files = sorted(
        TRACES_DIR.glob("S*.json")
    )

    print(
        f"Found {len(trace_files)} traces"
    )

    print(
        f"Output directory: {OUTPUT_DIR}"
    )

    print(
        f"Model: {MODEL_NAME}"
    )

    print(
        f"Parallel workers: {MAX_WORKERS}\n"
    )

    classified = 0
    skipped = 0
    failed = 0

    pending_traces = []

    # --------------------------------------------------------
    # Find pending classifications
    # --------------------------------------------------------

    for trace in trace_files:

        output_file = (
            OUTPUT_DIR / trace.name
        )

        if output_file.exists():

            print(
                f"⏩ {trace.stem} already classified "
                f"- skipping API call"
            )

            skipped += 1

        else:
            pending_traces.append(
                trace
            )

    print(
        "\n" + "=" * 60
    )

    print(
        f"Pending classifications: "
        f"{len(pending_traces)}"
    )

    print(
        f"Workers: {MAX_WORKERS}"
    )

    print(
        "=" * 60
    )

    # --------------------------------------------------------
    # Parallel classification
    # --------------------------------------------------------

    if pending_traces:

        with ThreadPoolExecutor(
            max_workers=MAX_WORKERS
        ) as executor:

            future_to_trace = {
                executor.submit(
                    classify_trace,
                    trace,
                ): trace
                for trace in pending_traces
            }

            for future in as_completed(
                future_to_trace
            ):

                trace = future_to_trace[
                    future
                ]

                try:

                    result = future.result()

                    if result == "CLASSIFIED":
                        classified += 1

                except Exception as error:

                    failed += 1

                    error_text = str(error)

                    print(
                        f"❌ {trace.stem} failed: "
                        f"{error_text}"
                    )

                    # Don't stop the entire batch
                    # because one scenario failed.
                    continue

    # --------------------------------------------------------
    # Final summary
    # --------------------------------------------------------

    print(
        "\n" + "=" * 60
    )

    print(
        "🏁 CLASSIFICATION COMPLETE"
    )

    print(
        "=" * 60
    )

    print(
        f"Newly classified : {classified}"
    )

    print(
        f"Skipped          : {skipped}"
    )

    print(
        f"Failed           : {failed}"
    )

    print(
        f"Total traces     : {len(trace_files)}"
    )

    print(
        f"Results saved in : {OUTPUT_DIR}"
    )

    print(
        f"Workers used     : {MAX_WORKERS}"
    )


# ============================================================
# Entry point
# ============================================================

if __name__ == "__main__":
    main()