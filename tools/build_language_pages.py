#!/usr/bin/env python3
"""Build crawlable multilingual HTML pages from index.html and assets/i18n/*.json.

Run from the repository root:
  python tools/build_language_pages.py
"""

from __future__ import annotations

import json
import re
from html import escape
from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
BASE_URL = "https://atlasenergieconseil.com"
LANGUAGES = ("fr", "en", "ar", "es")
LANGUAGE_LABELS = {"fr": "FR", "en": "EN", "ar": "AR", "es": "ES"}
VOID_TAGS = {
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
}
RAW_TEXT_TAGS = {"script", "style"}


class Node:
    def __init__(self, node_type, tag=None, attrs=None, data=""):
        self.node_type = node_type
        self.tag = tag
        self.attrs = list(attrs or [])
        self.data = data
        self.children = []
        self.parent = None

    def append(self, node):
        node.parent = self
        self.children.append(node)


class TreeBuilder(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = Node("document")
        self.stack = [self.root]

    def handle_decl(self, decl):
        self.stack[-1].append(Node("doctype", data=decl))

    def handle_comment(self, data):
        self.stack[-1].append(Node("comment", data=data))

    def handle_data(self, data):
        self.stack[-1].append(Node("text", data=data))

    def handle_starttag(self, tag, attrs):
        node = Node("element", tag=tag.lower(), attrs=attrs)
        self.stack[-1].append(node)
        if tag.lower() not in VOID_TAGS:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.stack[-1].append(Node("element", tag=tag.lower(), attrs=attrs))

    def handle_endtag(self, tag):
        tag = tag.lower()
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                return


def parse_html(html):
    parser = TreeBuilder()
    parser.feed(html)
    return parser.root


def serialize(node, parent_tag=None):
    if node.node_type == "document":
        return "".join(serialize(child) for child in node.children)
    if node.node_type == "doctype":
        return f"<!{node.data}>"
    if node.node_type == "comment":
        return f"<!--{node.data}-->"
    if node.node_type == "text":
        if parent_tag in RAW_TEXT_TAGS:
            return node.data
        return escape(node.data, quote=False)
    if node.node_type == "element":
        attrs = "".join(
            f" {name}" if value is None else f' {name}="{escape(str(value), quote=True)}"'
            for name, value in node.attrs
        )
        start = f"<{node.tag}{attrs}>"
        if node.tag in VOID_TAGS:
            return start
        body = "".join(serialize(child, node.tag) for child in node.children)
        return f"{start}{body}</{node.tag}>"
    return ""


def get_attr(node, name):
    for attr_name, value in node.attrs:
        if attr_name == name:
            return value
    return None


def set_attr(node, name, value):
    for index, (attr_name, _) in enumerate(node.attrs):
        if attr_name == name:
            node.attrs[index] = (name, value)
            return
    node.attrs.append((name, value))


def remove_attr(node, name):
    node.attrs = [(attr_name, value) for attr_name, value in node.attrs if attr_name != name]


def element_children(node):
    return [child for child in node.children if child.node_type == "element"]


def descendants(node):
    for child in node.children:
        if child.node_type == "element":
            yield child
            yield from descendants(child)


def parse_simple_selector(selector):
    spec = {
        "tag": None,
        "id": None,
        "classes": [],
        "attrs": [],
        "not": [],
        "nth_type": None,
        "nth_child": None,
        "last_child": False,
    }
    index = 0
    tag_match = re.match(r"^[a-zA-Z][a-zA-Z0-9-]*", selector)
    if tag_match:
        spec["tag"] = tag_match.group(0).lower()
        index = tag_match.end()

    while index < len(selector):
        char = selector[index]
        if char == ".":
            match = re.match(r"\.([a-zA-Z0-9_-]+)", selector[index:])
            spec["classes"].append(match.group(1))
            index += len(match.group(0))
        elif char == "#":
            match = re.match(r"#([a-zA-Z0-9_-]+)", selector[index:])
            spec["id"] = match.group(1)
            index += len(match.group(0))
        elif char == "[":
            end = selector.index("]", index)
            content = selector[index + 1 : end].strip()
            if "=" in content:
                name, value = content.split("=", 1)
                spec["attrs"].append((name.strip(), value.strip().strip("\"'")))
            else:
                spec["attrs"].append((content, None))
            index = end + 1
        elif selector.startswith(":not(", index):
            end = selector.index(")", index)
            spec["not"].append(parse_simple_selector(selector[index + 5 : end]))
            index = end + 1
        elif selector.startswith(":nth-of-type(", index):
            end = selector.index(")", index)
            spec["nth_type"] = int(selector[index + 13 : end])
            index = end + 1
        elif selector.startswith(":nth-child(", index):
            end = selector.index(")", index)
            spec["nth_child"] = int(selector[index + 11 : end])
            index = end + 1
        elif selector.startswith(":last-child", index):
            spec["last_child"] = True
            index += len(":last-child")
        else:
            raise ValueError(f"Unsupported selector part: {selector[index:]} in {selector}")
    return spec


def tokenize_selector(selector):
    tokens = []
    buffer = []
    pending = None
    bracket_depth = 0
    paren_depth = 0
    quote = None

    def flush():
        nonlocal buffer, pending
        part = "".join(buffer).strip()
        if part:
            tokens.append((pending, parse_simple_selector(part)))
            pending = "descendant"
        buffer = []

    for char in selector:
        if quote:
            buffer.append(char)
            if char == quote:
                quote = None
            continue
        if char in ("'", '"'):
            quote = char
            buffer.append(char)
            continue
        if char == "[":
            bracket_depth += 1
            buffer.append(char)
            continue
        if char == "]":
            bracket_depth -= 1
            buffer.append(char)
            continue
        if char == "(":
            paren_depth += 1
            buffer.append(char)
            continue
        if char == ")":
            paren_depth -= 1
            buffer.append(char)
            continue
        if bracket_depth == 0 and paren_depth == 0 and char == ">":
            flush()
            pending = "child"
            continue
        if bracket_depth == 0 and paren_depth == 0 and char.isspace():
            flush()
            continue
        buffer.append(char)
    flush()
    if tokens:
        tokens[0] = (None, tokens[0][1])
    return tokens


def matches(node, spec):
    if node.node_type != "element":
        return False
    if spec["tag"] and node.tag != spec["tag"]:
        return False
    if spec["id"] and get_attr(node, "id") != spec["id"]:
        return False
    classes = (get_attr(node, "class") or "").split()
    if any(class_name not in classes for class_name in spec["classes"]):
        return False
    for attr_name, expected in spec["attrs"]:
        actual = get_attr(node, attr_name)
        if actual is None:
            return False
        if expected is not None and actual != expected:
            return False
    if any(matches(node, not_spec) for not_spec in spec["not"]):
        return False
    if spec["nth_type"] is not None:
        siblings = [child for child in element_children(node.parent) if child.tag == node.tag]
        if siblings.index(node) + 1 != spec["nth_type"]:
            return False
    if spec["nth_child"] is not None:
        siblings = element_children(node.parent)
        if siblings.index(node) + 1 != spec["nth_child"]:
            return False
    if spec["last_child"]:
        siblings = element_children(node.parent)
        if not siblings or siblings[-1] is not node:
            return False
    return True


def query_selector_all(root, selector):
    current = [root]
    for combinator, spec in tokenize_selector(selector):
        next_nodes = []
        for node in current:
            candidates = element_children(node) if combinator == "child" else descendants(node)
            next_nodes.extend(candidate for candidate in candidates if matches(candidate, spec))
        current = next_nodes
    return current


def set_text(node, text):
    node.children = [Node("text", data=text)]
    node.children[0].parent = node


def replace_head_links(root, language):
    canonical_url = f"{BASE_URL}/{language}/"
    canonical_links = query_selector_all(root, "link[rel='canonical']")
    if canonical_links:
        set_attr(canonical_links[0], "href", canonical_url)

    og_urls = query_selector_all(root, "meta[property='og:url']")
    for meta in og_urls:
        set_attr(meta, "content", canonical_url)

    head = query_selector_all(root, "head")[0]
    head.children = [
        child
        for child in head.children
        if not (
            child.node_type == "element"
            and child.tag == "link"
            and get_attr(child, "rel") == "alternate"
        )
    ]

    canonical = canonical_links[0] if canonical_links else None
    insert_index = head.children.index(canonical) + 1 if canonical in head.children else 0
    alternate_nodes = []
    for alternate_language in LANGUAGES:
        alternate_nodes.append(Node("text", data="\n  "))
        alternate_nodes.append(
            Node(
                "element",
                tag="link",
                attrs=[
                    ("rel", "alternate"),
                    ("hreflang", alternate_language),
                    ("href", f"{BASE_URL}/{alternate_language}/"),
                ],
            )
        )
    alternate_nodes.append(Node("text", data="\n  "))
    alternate_nodes.append(
        Node(
            "element",
            tag="link",
            attrs=[
                ("rel", "alternate"),
                ("hreflang", "x-default"),
                ("href", f"{BASE_URL}/fr/"),
            ],
        )
    )
    for offset, node in enumerate(alternate_nodes):
        node.parent = head
        head.children.insert(insert_index + offset, node)


def apply_data_bindings(root, translations):
    for node in query_selector_all(root, "[data-i18n]"):
        path = get_attr(node, "data-i18n")
        value = nested_get(translations, path)
        if isinstance(value, str):
            set_text(node, value)

    for node in query_selector_all(root, "[data-i18n-attr]"):
        bindings = (get_attr(node, "data-i18n-attr") or "").split(",")
        for binding in bindings:
            if ":" not in binding:
                continue
            attr, path = [part.strip() for part in binding.split(":", 1)]
            value = nested_get(translations, path)
            if attr and isinstance(value, str):
                set_attr(node, attr, value)


def nested_get(source, path):
    value = source
    for part in path.split("."):
        if not isinstance(value, dict) or part not in value:
            return None
        value = value[part]
    return value


def apply_selector_translations(root, translations):
    for selector, text in translations.get("dom", {}).get("text", {}).items():
        for node in query_selector_all(root, selector):
            set_text(node, text)

    for selector, attrs in translations.get("dom", {}).get("attrs", {}).items():
        for node in query_selector_all(root, selector):
            for attr_name, value in attrs.items():
                set_attr(node, attr_name, value)


def apply_diagnostic_translations(root, translations):
    questions = translations.get("diagnostic", {}).get("questions", {})
    for fieldset in query_selector_all(root, "[data-diagnostic-question]"):
        question_key = get_attr(fieldset, "data-diagnostic-question")
        question = questions.get(question_key, {})
        legends = query_selector_all(fieldset, "legend")
        if legends and question.get("label"):
            set_text(legends[0], question["label"])
        for button in query_selector_all(fieldset, "[data-diagnostic-option]"):
            option_key = get_attr(button, "data-value")
            option_label = question.get("options", {}).get(option_key)
            if option_label:
                set_text(button, option_label)

    progress_nodes = query_selector_all(root, "[data-diagnostic-progress]")
    total_questions = len(query_selector_all(root, "[data-diagnostic-question]"))
    progress = translations.get("diagnostic", {}).get("progress", "{answered} / {total}")
    for node in progress_nodes:
        set_text(node, progress.replace("{answered}", "0").replace("{total}", str(total_questions)))


def apply_faq_translations(root, translations):
    faq_items = translations.get("faq", {}).get("items", [])
    for index, item in enumerate(query_selector_all(root, ".faq-item")):
        if index >= len(faq_items):
            break
        summaries = query_selector_all(item, "summary")
        answers = query_selector_all(item, "p")
        if summaries:
            set_text(summaries[0], faq_items[index]["question"])
        if answers:
            set_text(answers[0], faq_items[index]["answer"])


def apply_structured_data(root, translations, language):
    canonical_url = f"{BASE_URL}/{language}/"
    professional_nodes = query_selector_all(root, "#schema-professional-service")
    if professional_nodes:
        professional_data = {
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            "name": "Atlas Energie Conseil",
            "url": canonical_url,
            "email": "contact@atlasenergieconseil.com",
            "description": translations.get("schema", {}).get(
                "professionalDescription", translations.get("meta", {}).get("description", "")
            ),
            "areaServed": {"@type": "Country", "name": "Morocco"},
            "sameAs": ["https://www.linkedin.com/in/khalid-zergoun-a361421a6/"],
        }
        set_text(professional_nodes[0], "\n    " + json.dumps(professional_data, ensure_ascii=False, indent=2) + "\n  ")

    faq_nodes = query_selector_all(root, "#schema-faq")
    if faq_nodes:
        faq_data = {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": item["question"],
                    "acceptedAnswer": {"@type": "Answer", "text": item["answer"]},
                }
                for item in translations.get("faq", {}).get("items", [])
            ],
        }
        set_text(faq_nodes[0], "\n    " + json.dumps(faq_data, ensure_ascii=False, indent=2) + "\n  ")


def normalize_asset_paths(root):
    for node in descendants(root):
        if node.node_type != "element":
            continue
        for attr_name in ("href", "src", "poster"):
            value = get_attr(node, attr_name)
            if not value:
                continue
            if value.startswith(("assets/", "style.css", "script.js")):
                set_attr(node, attr_name, f"/{value}")


def replace_language_switcher(root, active_language, translations):
    switchers = query_selector_all(root, ".language-switcher")
    if not switchers:
        return
    switcher = switchers[0]
    set_attr(switcher, "aria-label", translations.get("language", {}).get("aria", "Choose language"))
    children = []
    for language in LANGUAGES:
        is_active = language == active_language
        attrs = [
            ("href", f"/{language}/"),
            ("data-language-option", language),
            ("aria-pressed", "true" if is_active else "false"),
        ]
        if is_active:
            attrs.append(("aria-current", "page"))
            attrs.append(("class", "is-active"))
        anchor = Node("element", tag="a", attrs=attrs)
        anchor.append(Node("text", data=LANGUAGE_LABELS[language]))
        children.extend([Node("text", data="\n          "), anchor])
    children.append(Node("text", data="\n        "))
    switcher.children = children
    for child in children:
        child.parent = switcher


def apply_page_language(root, language, translations):
    html_nodes = query_selector_all(root, "html")
    if html_nodes:
        set_attr(html_nodes[0], "lang", translations.get("language", {}).get("code", language))
        set_attr(html_nodes[0], "dir", translations.get("language", {}).get("dir", "rtl" if language == "ar" else "ltr"))

    title_nodes = query_selector_all(root, "title")
    if title_nodes:
        set_text(title_nodes[0], translations.get("meta", {}).get("title", "Atlas Energie Conseil"))


def build_language_page(source_html, language):
    translations = json.loads((ROOT / "assets" / "i18n" / f"{language}.json").read_text(encoding="utf-8"))
    root = parse_html(source_html)
    apply_page_language(root, language, translations)
    replace_head_links(root, language)
    normalize_asset_paths(root)
    replace_language_switcher(root, language, translations)
    apply_data_bindings(root, translations)
    apply_selector_translations(root, translations)
    apply_diagnostic_translations(root, translations)
    apply_faq_translations(root, translations)
    apply_structured_data(root, translations, language)
    return re.sub(r"[ \t]+\n", "\n", serialize(root))


def main():
    source_html = (ROOT / "index.html").read_text(encoding="utf-8")
    for language in LANGUAGES:
        output_dir = ROOT / language
        output_dir.mkdir(exist_ok=True)
        output_path = output_dir / "index.html"
        output_path.write_text(build_language_page(source_html, language), encoding="utf-8", newline="\n")
        print(f"Wrote {output_path.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
