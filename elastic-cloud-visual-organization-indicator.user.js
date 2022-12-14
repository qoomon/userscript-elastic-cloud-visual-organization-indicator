// ==UserScript==
// @name         Elastic Cloud Visual Organization Indicator
// @namespace    https://qoomon.github.io
// @version      1.0.0
// @updateURL    https://github.com/qoomon/userscript-elastic-cloud-visual-organization-indicator/raw/main/elastic-cloud-visual-organization-indicator.user.js
// @downloadURL  https://github.com/qoomon/userscript-elastic-cloud-visual-organization-indicator/raw/main/elastic-cloud-visual-organization-indicator.user.js
// @description  try to take over the world!
// @author       qoomon
// @match        https://cloud.elastic.co/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=elastic.co
// @grant        none
// ==/UserScript==



// --- Configure display name and color ------------------------------------

function getDisplayName(organization) {
    return organization.name
}

function getDisplayColor(organization) {
    const displayName = getDisplayName(organization)
    if(displayName.match(/(^|[^a-zA-Z])(production|prod)([^a-zA-Z]|$)/)) return '#921b1d'
    if(displayName.match(/(^|[^a-zA-Z])(staging|stage)([^a-zA-Z]|$)/)) return '#a27401'
    if(displayName.match(/(^|[^a-zA-Z])(sandbox|lab)([^a-zA-Z]|$)/)) return '#016a83'
    return '#7c7c7c'
}

window.addEventListener('changestate', async () => {
    'use strict';

    const pageHeaderElement = await untilDefined(() => document.querySelector('[data-test-id="page-header"]'))
    if(pageHeaderElement._accountIndicator) return;
    pageHeaderElement._accountIndicator = true;

    const organization = await getOrganizationInfo()

    const displayColor = getDisplayColor(organization)

    // insert indicator bar
    const indicatorBarElement = document.createElement('div')
    indicatorBarElement.style.cssText = `
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 100vw;
      height: 8px;
      background: repeating-linear-gradient(-45deg, ${displayColor}, ${displayColor} 12px, transparent 0px, transparent 24px);
    `;
    pageHeaderElement.style.flexFlow = 'wrap';
    pageHeaderElement.style.height = '54px';
    pageHeaderElement.style.paddingBottom = '6px';
    pageHeaderElement.insertAdjacentElement('beforeEnd', indicatorBarElement)

    // insert indicator label
    // /account
    const organizationLabelElement = document.createElement('a')
    organizationLabelElement.href = '/account'
    organizationLabelElement.innerText = getDisplayName(organization)
    organizationLabelElement.style.cssText = `
        color: whitesmoke;
        font-size: 12px;
        line-height: 24px;
        white-space: nowrap;
        background-color: ${displayColor};
        border-radius: 48px;
        padding: 0px 10px;
        margin: auto;
        text-decoration: none;
    `;

    const userMenuButtonElement = await untilDefined(() => pageHeaderElement.querySelector(':scope .euiHeaderSection--right .euiHeaderSectionItem:last-child'))
    userMenuButtonElement.insertAdjacentElement('beforeBegin', organizationLabelElement)
});

// --- Utils ---------------------------------------------------------------

async function untilDefined(fn) {
    return new Promise(resolve => {
        const interval = setInterval(() => {
            const result = fn()
            if (result != undefined) {
                clearInterval(interval)
                resolve(result)
            }
        }, 100)
        })
}

async function getOrganizationInfo() {
    return await fetch(`${window.location.origin}/api/v1/organizations`)
        .then(res => res.json())
        .then(data => data.organizations[0])
}

// --- Event Management -----------------------------------------------------

window.onload = () => window.dispatchEvent(new Event('changestate'));

window.history.pushState = new Proxy(window.history.pushState, {
  apply: (target, thisArg, argArray) => {
    const result = target.apply(thisArg, argArray)
    window.dispatchEvent(new Event('pushstate'))
    window.dispatchEvent(new Event('changestate'))
    return result
  }
})

window.history.replaceState = new Proxy(window.history.replaceState, {
  apply: (target, thisArg, argArray) => {
    const result = target.apply(thisArg, argArray)
    window.dispatchEvent(new Event('replacestate'))
    window.dispatchEvent(new Event('changestate'))
    return result
  }
})

window.addEventListener('popstate', () => {
    window.dispatchEvent(new Event('changestate'));
})
