---
version: 0.1.28
date: May 12, 2025
status: draft
license: CC-BY 4.0
---

<!-- [[titlepage]] -->

# Test Case: Comprehensive Markdown Elements

> **Note**
> This document demonstrates a wide variety of Markdown features and GitHub callout styles.

<!-- [[toc]] -->

## Headings

# H1

## H2

### H3

#### H4

##### H5

###### H6

---

## Text Formatting

- *Italic*
- **Bold**
- ***Bold Italic***
- ~~Strikethrough~~
- <sup>Superscript</sup>
- <sub>Subscript</sub>
- `Inline code`

---

## Lists

### Unordered

- Item 1
  - Subitem 1.1
    - Subitem 1.1.1
- Item 2

### Ordered

1. First
2. Second
   1. Second - subitem
   2. Second - subitem 2
3. Third

---

## Links & Images

- [GitHub](https://github.com)
- ![Test image](assets/test-image.png "Test image")

---

## Blockquotes & Callouts

> This is a standard blockquote.

<!-- legal excerpt -->
> This one displays as a normal blockquote in github, and I can style it later, and we could directly throw in metadata on the law text to display nicely if usefull.

> [!Note]
> This is a GitHub note callout.

> [!Warning]
> This is a GitHub warning callout.

> [!Tip]
> This is a GitHub tip callout.

> [!Important]
> This is a GitHub important callout.

> [!Caution]
> This is a GitHun caution callout.

---

## Code

### Inline

Here is some `inline code`.

### Block

```python
def hello_world():
    print("Hello, world!")
```

```bash
# Bash example
echo "Hello, Markdown!"
```

---

## Tables

| Name     | Value | Description         |
|----------|-------|---------------------|
| Alpha    | 1     | First entry         |
| Beta     | 2     | Second entry        |
| Gamma    | 3     | Third entry         |

---

## Details/Summary

<details>
  <summary>Click to expand for more info</summary>

- **Title:** Example Title
- **URL:** [Example](https://example.com)
- **Publisher:** Example Publisher
- **License:** MIT
- **Type:** Article
- **Publication date:** 2024-06-01

</details>

---

## Task Lists

- [x] Write test case
- [ ] Review content
- [ ] Add more examples

---

## Horizontal Rule

---

## Mermaid

### Here's a flowchart

```mermaid
graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C[Great!]
    B -->|No| D[Debug]
    D --> B
```

### And a sequence diagram

```mermaid
sequenceDiagram
    participant A as Alice
    participant B as Bob
    A->>B: Hello Bob!
    B-->>A: Hello Alice!
```

## Footnotes

Here is a statement with a footnote.[^1]

[^1]: This is the footnote text.
