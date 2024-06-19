[![Discourse Topics][discourse-shield]][discourse-url]
[![Issues][issues-shield]][issues-url]
[![Latest Releases][release-shield]][release-url]
[![Contributor Shield][contributor-shield]][contributors-url]

[discourse-shield]: https://img.shields.io/discourse/topics?label=Discuss%20This%20Tool&server=https%3A%2F%2Fdeveloper.sailpoint.com%2Fdiscuss
[discourse-url]: https://developer.sailpoint.com/discuss/tag/workflows
[issues-shield]: https://img.shields.io/github/issues/sailpoint-oss/repo-template?label=Issues
[issues-url]: https://github.com/sailpoint-oss/repo-template/issues
[release-shield]: https://img.shields.io/github/v/release/sailpoint-oss/repo-template?label=Current%20Release
[release-url]: https://github.com/sailpoint-oss/repo-template/releases
[contributor-shield]: https://img.shields.io/github/contributors/sailpoint-oss/repo-template?label=Contributors
[contributors-url]: https://github.com/sailpoint-oss/repo-template/graphs/contributors

# Disconnected App SaaS Connector

[Explore the docs »](https://developer.sailpoint.com/discuss/t/identity-fusion-connector/38793)

[New to the CoLab? Click here »](https://developer.sailpoint.com/discuss/t/about-the-sailpoint-developer-community-colab/11230)

## Changelog

-   0.0.1 (2024-06-19):
    -   Initial release

## Introduction

This is a loopback SaaS connector that helps managing disconnected apps differently. The connector reads from a disconnected source, typically a delimited text source (although any source is supported), and mimics the source contents on aggregation. The goal is effectively replacing the disconnected source by this new source that is capable of reflecting any provisioning request immediately. This helps administrators to directly close the provisioning loop of a disconnected source. In the event that the disconnected source is updated, a following aggregation replaces the source's contents with the new data, so if end-system provisioning didn't happen the system reflects the real status.

## Configuration

The connector configuration only needs a valid API loopback connection based on an administrator's PAT and an origin source name. The connector supports schema discovery for your convenience so, before aggregating any data, one must discover the schema, select the exact same id and name attributes as the origin source and select the right entitlement types for the entitlement attributes (entitlement schemas are also cloned from origin source).

Manual provisioning operators can leverage native change detection to replicate account changes. These operators should also be included in the latest approval stage for any permission so they are quickly aware of the request and approve when the real provisioning is done.

<!-- CONTRIBUTING -->

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag `enhancement`.
Don't forget to give the project a star! Thanks again!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<!-- LICENSE -->

## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<!-- CONTACT -->

## Discuss

[Click Here](https://developer.sailpoint.com/dicuss/tag/{tagName}) to discuss this tool with other users.
