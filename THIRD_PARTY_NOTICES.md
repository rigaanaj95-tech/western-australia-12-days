# Third-Party Notices

The MIT License in `LICENSE` covers only original project code and original project assets. The geographic data below remains governed by its own source license.

The bundled Boundary Library supports geographic maps when a trip region explicitly declares a boundary file. Trips without one continue to use the fixed templates in `assets/maps/templates/manifest.json`.

## Western Australia state boundary

- Source: [`geoBoundaries` `gbOpen` AUS ADM1 simplified release](https://github.com/wmgeolab/geoBoundaries/tree/41af8f1/releaseData/gbOpen/AUS/ADM1), boundary year 2021. The [AUS ADM1 API metadata](https://www.geoboundaries.org/api/current/gbOpen/AUS/ADM1/) identifies the Australian Bureau of Statistics as the upstream source.
- License: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
- Attribution: geoBoundaries at William & Mary and the Australian Bureau of Statistics.
- Repository changes: The Western Australia feature was extracted from the simplified ADM1 collection, coordinates were rounded to five decimal places, and the geometry was projected into `assets/maps/generated-western-australia.svg`.

## Country boundaries

- Source: [Natural Earth](https://www.naturalearthdata.com/) data distributed through [`datasets/geo-countries`](https://github.com/datasets/geo-countries).
- License: Natural Earth states that its map data is [public domain](https://www.naturalearthdata.com/about/terms-of-use/). The data package and its transformations are distributed under [Open Data Commons PDDL 1.0](https://opendatacommons.org/licenses/pddl/1-0/).
- Attribution: Natural Earth and `datasets/geo-countries`.
- Repository changes: The aggregate country dataset was reduced to the selected countries and serialized as one GeoJSON `FeatureCollection` per country.
- Provenance note: `scripts/sync-boundaries.mjs` currently references the mutable `main` branch. The exact revision represented by the checked-in snapshot was not recorded and must be confirmed or pinned by a maintainer before the data is refreshed or represented as a reproducible release.

## China provincial boundaries

- Source: the pinned [`geoBoundaries` `gbOpen` CHN ADM1 simplified release](https://github.com/wmgeolab/geoBoundaries/tree/9469f09/releaseData/gbOpen/CHN/ADM1). The corresponding [CHN ADM1 API metadata](https://www.geoboundaries.org/api/current/gbOpen/CHN/ADM1/) names geoBoundaries and Wikimedia Commons as sources.
- License: The layer metadata reports the individual upstream data as Public Domain. The [geoBoundaries project license](https://github.com/wmgeolab/geoBoundaries/blob/main/LICENSE) applies CC BY 4.0 to project code and derivative works while stating that individual Boundary files remain governed by their own metadata. geoBoundaries attribution is retained accordingly.
- Attribution: geoBoundaries at William & Mary, plus the upstream source identified by the release metadata.
- Repository changes: The simplified ADM1 collection was split into individual GeoJSON `FeatureCollection` files and given normalized local filenames; the geometry was not redrawn.
- Provenance note: The downloaded metadata exposes only the generic `commons.wikimedia.org/wiki/File` value for the upstream Wikimedia source. A maintainer must confirm the exact Wikimedia file URL before claiming more specific upstream provenance.

## Major-city boundaries

- Source: [OpenStreetMap](https://www.openstreetmap.org/copyright) data returned by the public [Nominatim service](https://operations.osmfoundation.org/policies/nominatim/).
- License: [Open Database License 1.0 (ODbL-1.0)](https://opendatacommons.org/licenses/odbl/1-0/).
- Attribution: © OpenStreetMap contributors.
- Repository changes: Results for a fixed list of cities were cached and serialized as one administrative-boundary GeoJSON `FeatureCollection` per city. Returned `osm_type` and `osm_id` values remain in each feature's properties.
- Provenance note: The exact retrieval date and OpenStreetMap database snapshot were not recorded. A maintainer must record them when these cached files are refreshed.

Source and license review is a maintainer task whenever Boundary Library files are added, refreshed, or prepared for a public release. Ordinary trip generation must not use or refresh this library.
