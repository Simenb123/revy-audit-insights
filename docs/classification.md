# Classification Models

This project groups knowledge and documents using a set of shared classification models.

- **Category** – hierarchical grouping of knowledge articles. Categories can have parent/child relationships and reference applicable audit phases.
- **ContentType** – describes the type of knowledge article such as legislation, standards or internal guidance.
- **SubjectArea** – hierarchical domain areas used to relate articles, audit actions and document types.
- **Tag** – simple labels that can be attached to articles or audit actions for flexible filtering.
- **DocumentType** – represents the structure and expected content for uploaded documents. Document types can be connected to subject areas.

`DocumentType` entities can be linked to one or more `SubjectArea` records via the `document_type_subject_areas` table. Articles and audit actions may also reference `SubjectArea` and `Tag` records. This allows the same vocabulary to be reused across different parts of the system.
