## 2024-05-24 - Skip to Content for Dynamic Headers
**Learning:** When headers are injected via JavaScript, accessibility features like "Skip to Content" links must be carefully handled. The link needs to be the first focusable element *in the injected content* or handled globally. We solved this by injecting it with the header and ensuring the target ID is dynamically assigned to the main tag.
**Action:** For future dynamic sites, verify tab order and focus management immediately after content injection.

## 2024-05-24 - Handling Existing IDs
**Learning:** When retrofitting accessibility (like assigning IDs for skip links), check for existing IDs to avoid overwriting them. If an ID exists, the skip link's target must match it. In async loading scenarios (header loaded later), this requires synchronization which can be complex.
**Action:** Always check `if (!element.id)` before assigning a default ID.
## 2025-10-14 - Search Landmark Accessibility
**Learning:** Adding a  landmark and a properly associated (even if hidden) label to a search input significantly improves the experience for screen reader users, allowing them to quickly locate and understand the search functionality.
**Action:** Always check for  on search forms and ensure inputs have accessible labels, using  if a visible label is not desired.
## 2025-10-14 - Search Landmark Accessibility
**Learning:** Adding a `role="search"` landmark and a properly associated (even if hidden) label to a search input significantly improves the experience for screen reader users, allowing them to quickly locate and understand the search functionality.
**Action:** Always check for `role="search"` on search forms and ensure inputs have accessible labels, using `.sr-only` if a visible label is not desired.
