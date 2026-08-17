# Data licensing and attribution

The Apache-2.0 licence applies to source code, not automatically to third-party road data.

The repository contains a tiny demonstration catalog with factual values and links to the Dubai Police source. It is not a complete or production-grade database and carries no claim of official endorsement, timeless accuracy, or redistribution rights over the source database.

The Dubai Pulse metadata page describes its speed/radar dataset as open data but currently lists the licence as unspecified. Do not import and commit the full dataset until the applicable licence or written permission has been verified and recorded.

The local CSV importer is a review tool, not a licence detector. It requires an HTTPS source URL and a non-placeholder licence identifier or written-permission reference, writes only beneath the git-ignored `local-data/` directory, and records a SHA-256 checksum of the exact input bytes. Generated artifacts remain `redistributionApproved: false`. A source URL, asserted licence, or checksum is provenance evidence—not proof that the asserted terms apply or that redistribution is permitted.

If OpenStreetMap geometry is added, keep it in a clearly separate data package, provide OpenStreetMap attribution, and comply with the Open Database License (ODbL), including share-alike obligations for a derived database where applicable. Do not use the public OpenStreetMap tile servers for production/offline bulk traffic.

Every proposed production record must include a primary source URL, source date, verification date, exact geometry/direction, confidence, and licence identifier. Posted and temporary signs always override repository data.

Before a store release, obtain a documented legal/provenance decision for every bundled record, retain the reviewed source checksum and permission evidence, and exclude any pack whose terms are missing or incompatible. Software and icon/font notices are tracked separately in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
