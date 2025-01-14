![](https://img.shields.io/badge/Built%20with%20%E2%9D%A4%EF%B8%8F-at%20Technologiestiftung%20Berlin-blue)

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

# {repo-template}

## TODO (after you generated the repo)

- [ ] Review the content of the README.md and adjust to your liking
- [ ] Read the README.md till the end and adjust the content licensing,
      logos, etc (I know you stopped at tbd...)
- [ ] Adjust the file [.github/CODEOWNERS](./.github/CODEOWNERS)
- [ ] Adjust the files under [.github/ISSUE_TEMPLATE](./.github/ISSUE_TEMPLATE)
- [ ] If you use staging and main branches use this template for [.github/renovate.json](./.github/renovate.json)

```json
{
	"$schema": "https://docs.renovatebot.com/renovate-schema.json",
	"extends": ["github>technologiestiftung/renovate-config"],
	"baseBranches": ["staging"]
}
```

- [ ] Do you want to honor all kinds of contributions? Use [all-contributors](https://allcontributors.org/)

```bash
npx all-contributors-cli check
npx all-contributors-cli add luisebrandenburger code
```

You can use it on GitHub just by commenting on PRs and issues:

```plain
@all-contributors please add @ff6347 for infrastructure, tests and code
```

- [ ] Add your project description
- [ ] Get fancy shields at https://shields.io

# Kiezbox Notfall App

The Kiezbox Emergency App is a progressive web app that was specially developed for the use on a BananaPi. It enables offline communication and supports SIP-based VoIP calls for contacting emergency services, even with a limited or no internet connection.

Below are setup instructions for running the project locally and steps for deploying it.

## Prerequisites

Ensure you have the following installed on your machine:

-   **Node.js** (v18 or higher)
-   **npm** (usually included with Node.js)

tbd...

## Installation

1. **Clone the Repository**

  ```bash
  git clone <your-repo-url>
  cd <your-repo-name>
  ```

2. **Install Dependencies**

  Run the following command to install all necessary packages and add the .env:

  ```bash
  npm install && npm run setup:env
  ```
  
  Then update the content of the env files accordingly

tbd...

## Running the Project

To start a local development server, use the following command:

```bash
npm run dev
```

## Usage or Deployment

tbd...

## Development

tbd...

## Tests

tbd...

## Contributing

Before you create a pull request, write an issue so we can discuss your changes.

## Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https:/github.com/LuiseBrandenburger"><img src="https://avatars.githubusercontent.com/u/61413319?s=?s=64" width="64px;" alt="Luise Brandenburger"/><br /><sub><b>Luise Brandenburger</b></sub></a><br /><a href="https://github.com/technologiestiftung/kiezbox-pwa/commits?author=LuiseBrandenburger" title="Documentation">📖</a> <a href="https://github.com/technologiestiftung/kiezbox-pwa/commits?author=LuiseBrandenburger" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

## Content Licensing

Texts and content available as [CC BY](https://creativecommons.org/licenses/by/3.0/de/).

Illustrations by {MARIA_MUSTERFRAU}, all rights reserved.

## Credits

<table>
  <tr>
    <td>
      Made by  <a href="https://www.technologiestiftung-berlin.de/">
        <br />
        <br />
        <img width="150" src="https://logos.citylab-berlin.org/logo-technologiestiftung-berlin-de.svg" />
      </a>
    </td>
    <td>
      Supported by <a href="https://www.berlin.de/">
        <br />
        <br />
        <img width="150" src="https://logos.citylab-berlin.org/logo-berlin.svg" />
      </a>
    </td>
  </tr>
</table>

## Related Projects
