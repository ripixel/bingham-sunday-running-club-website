# CMS Content Rules

**Attention Future Developers and AI Agents:**

This website is designed to be fully manageable by non-technical content editors via the Decap CMS.

## The Golden Rule
> **Every piece of text visible on the website MUST be configurable via the CMS.**

## Implementation Guidelines

### 1. No Hardcoded Content
- **DO NOT** hardcode text strings (headings, paragraphs, button labels, etc.) in HTML templates.
- **DO NOT** hardcode image paths in HTML templates (unless they are purely structural assets like UI icons).
- All content must be pulled from the `content` global object passed to the templates.

### 2. CMS Replicability
- When adding new sections or features:
    1.  **Schema**: Add the corresponding field/widget definition to `admin/config.yml`.
    2.  **Data**: Add default/placeholder data to the JSON file in `content/`.
    3.  **Template**: Use Handlebars syntax (e.g., `{{content.pages.home.hero.title}}`) in the HTML.

### 3. Structural Flexibility
- Use **List Widgets** for repeating elements (features, cards, gallery items) so editors can add, remove, or reorder items.
- Use **Optional Fields** to allow editors to leave out content without breaking the layout.

### 4. Iconography
- Prefer **Emojis** for user-configurable icons (easy to input, no file upload needed).
- If using SVGs/Images, ensure there is an image upload field.

## Why?
The end-users are not developers. If they need to change "Call us" to "Email us" or update a date, they should not need to touch the codebase.
