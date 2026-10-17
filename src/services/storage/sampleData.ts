import { Entity, Note, Project, ProjectData, Relationship, Source } from '@/types';

export function createSampleProject(): ProjectData {
  const now = new Date().toISOString();

  const project: Project = {
    id: 'project-getting-started',
    type: 'project',
    name: 'Getting Started — Trace Tutorial & Overview',
    created_at: now,
    updated_at: now,
    markdownBody: `# Getting Started with Trace OSINT

Welcome to **Trace**, your local-first intelligence investigation workbench designed for cyber threat intelligence, private investigations, and open-source intelligence (OSINT).

---

## ⚡ Quick Start & Interactive Feature Tour

### 1. 🌐 Interactive Graph Canvas
- **Circular Glow & Avatars**: Entities feature clean circular nodes, photos/avatars inside nodes, and soft glowing halo effects on hover without rectangular artifact boxes.
- **Physics Bounce Simulation**: Click and drag any node on the graph canvas — notice how neighboring nodes calculate repulsive forces and gently bounce out of the way!
- **Notes on the Graph**: Toggle the **Notes** icon in the top-right toolbar of the graph to display investigation notes directly on the graph canvas, automatically connected via \`[[wikilinks]]\`.

### 2. 👤 Entity Records & Photo Support
- Double-click on **Elena Rostova** in the left sidebar or graph to view her profile.
- You can upload local photos (converted to data URLs) or paste external image URLs to give any entity a recognizable face.
- Notice attribute preset suggestions: start typing in attribute key fields to get Google-search-style autocomplete suggestions for \`phone\`, \`email\`, \`address\`, \`crypto_wallet\`, etc.

### 3. 🗺️ Integrated Map for Addresses & Locations
- Open the entity **OSINT Operations Center (London HQ)**.
- Notice the address and coordinates attribute: click the **Map** button next to it to immediately open the interactive OpenStreetMap viewer with coordinate lookup.

### 4. 🗂️ VS Code-Style Tabs
- Single-clicking items opens them in a **Preview Tab** (italic title).
- If you open another record without making changes, the preview tab is cleanly replaced.
- Double-click the tab, edit any field, or right-click and select **Pin** to make it permanent.

### 5. 🖱️ Custom Context Menus Everywhere
- Right-click anywhere: on graph nodes, edges, canvas background, sidebar items, and tab headers to access contextual actions.

### 6. 📁 Open Project in Finder / File Explorer
- Click **Open Folder** in the project header or the sidebar footer to open your raw \`.md\` Markdown files directly on your operating system's disk.

### 7. ⌨️ Keyboard Shortcuts
- Press \`?\` or \`Cmd/Ctrl + /\` to open the full Keyboard Shortcuts cheat-sheet.
- \`Cmd/Ctrl + K\`: Command Palette
- \`Cmd/Ctrl + G\`: Jump to Graph Canvas
- \`Cmd/Ctrl + O\`: Project Overview
- \`Cmd/Ctrl + F\`: Local SQLite Full-Text Search
- \`Cmd/Ctrl + ,\`: Application Settings
`,
  };

  const entities: Entity[] = [
    {
      id: 'ent-person-01',
      type: 'person',
      name: 'Elena "Cipher" Rostova',
      aliases: ['elena_cipher', 'cipher_ops', 'Елена Ростова'],
      created_at: now,
      updated_at: now,
      tags: ['lead-subject', 'cryptography', 'tier-1'],
      attributes: {
        photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
        phone: '+44 20 7946 0912',
        email: 'e.rostova@osint-lab.org',
        telegram: '@elena_cipher',
        nationality: 'British / Ukrainian',
        pgp_fingerprint: '8F2B 3C19 D94A 7E51',
      },
      markdownBody: `# Elena "Cipher" Rostova

## Profile Summary
Senior threat intelligence analyst and digital forensics specialist. Serves as our primary demonstrator profile in this Getting Started workspace.

## Key Observations
- Operates primary secure gateway communications for [[ent-organization-01]].
- Frequently accesses operational infrastructure from [[ent-location-01]].
- Associated with Telegram channel and broadcast bot [[ent-account-01]].

## Evidence References
- [[src-01]] Official Registration Records
- [[src-03]] Passive DNS & WHOIS Archival Extract
`,
    },
    {
      id: 'ent-location-01',
      type: 'location',
      name: 'OSINT Operations Center (London HQ)',
      aliases: ['London Station', 'HQ Alpha'],
      created_at: now,
      updated_at: now,
      tags: ['facility', 'operational', 'uk'],
      attributes: {
        photo: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=200&auto=format&fit=crop&q=80',
        address: '10 Downing Street, London SW1A 2AA, United Kingdom',
        location: '51.503399, -0.127640',
        country: 'United Kingdom',
        city: 'London',
      },
      markdownBody: `# OSINT Operations Center (London HQ)

## Location Overview
Primary coordination center for regional cyber analytics and research telemetry.

> [!TIP]
> Click the **Map** button next to the address in the attribute table above to launch the interactive OpenStreetMap modal!

## Associated Personnel
- [[ent-person-01]] is station lead at this facility.
`,
    },
    {
      id: 'ent-organization-01',
      type: 'organization',
      name: 'Shadow Financial Network Ltd',
      aliases: ['ShadowFin', 'SFN Global'],
      created_at: now,
      updated_at: now,
      tags: ['corporate', 'holding', 'escrow'],
      attributes: {
        company_reg: 'OC348912',
        jurisdiction: 'United Kingdom (Companies House)',
        website: 'https://shadow-fin.example.com',
        status: 'Active',
      },
      markdownBody: `# Shadow Financial Network Ltd

## Entity Summary
Financial and technical escrow entity identified during the digital transaction audit.

## Connected Assets
- Holds and controls escrow vault [[ent-crypto-01]].
- Operates clearnet redundancy gateway [[ent-domain-01]].
- Wholly owned subsidiary of [[ent-company-01]].
`,
    },
    {
      id: 'ent-crypto-01',
      type: 'custom',
      custom_type: 'crypto_wallet',
      name: 'BTC Cold Escrow Vault',
      aliases: ['Primary Escrow Node', 'Cold Storage Alpha'],
      created_at: now,
      updated_at: now,
      tags: ['blockchain', 'bitcoin', 'escrow'],
      attributes: {
        crypto_wallet: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        blockchain: 'Bitcoin',
        balance: '142.50 BTC',
        first_seen: '2022-11-14',
      },
      markdownBody: `# BTC Cold Escrow Vault

## Wallet Analysis
Cold storage multi-signature Bitcoin address referenced across historical ledger transactions.

- Source verification: [[src-02]]
- Controlling entity: [[ent-organization-01]]
`,
    },
    {
      id: 'ent-domain-01',
      type: 'domain',
      name: 'secure-drop.osint-preview.net',
      aliases: ['osint-preview.net'],
      created_at: now,
      updated_at: now,
      tags: ['infrastructure', 'dns', 'gateway'],
      attributes: {
        domain: 'secure-drop.osint-preview.net',
        registrar: 'Namecheap Inc.',
        nameserver: 'ns1.cloudflare.com',
        ssl_issuer: "Let's Encrypt Authority",
      },
      markdownBody: `# secure-drop.osint-preview.net

## Infrastructure Details
Encrypted staging domain used for telemetric reporting and data ingestion pipelines.

- Direct A record resolution: [[ent-ip-01]]
- Operated by [[ent-organization-01]]
`,
    },
    {
      id: 'ent-ip-01',
      type: 'ip',
      name: '198.51.100.42',
      aliases: ['gateway-node-04'],
      created_at: now,
      updated_at: now,
      tags: ['network', 'hosting', 'ipv4'],
      attributes: {
        ip_address: '198.51.100.42',
        asn: 'AS13335 Cloudflare Inc.',
        reverse_dns: 'gateway-node-04.secure-drop.osint-preview.net',
        country: 'United States',
      },
      markdownBody: `# 198.51.100.42

## Network Host
IPv4 edge node hosting the primary API endpoint for [[ent-domain-01]].
`,
    },
    {
      id: 'ent-account-01',
      type: 'account',
      name: '@cipher_intel_bot',
      aliases: ['t.me/cipher_intel_bot'],
      created_at: now,
      updated_at: now,
      tags: ['telegram', 'bot', 'automation'],
      attributes: {
        platform: 'Telegram',
        handle: '@cipher_intel_bot',
        verified: 'true',
      },
      markdownBody: `# @cipher_intel_bot

## Telegram Channel Bot
Automated OSINT broadcast bot managed by [[ent-person-01]].
`,
    },
    {
      id: 'ent-company-01',
      type: 'company',
      name: 'Nordic Security & Intelligence OU',
      aliases: ['NSI Estonia'],
      created_at: now,
      updated_at: now,
      tags: ['parent-company', 'estonia', 'eu'],
      attributes: {
        company_reg: '14920192',
        registry: 'Estonian e-Business Register',
        address: 'Narva mnt 5, 10117 Tallinn, Estonia',
      },
      markdownBody: `# Nordic Security & Intelligence OU

## Corporate Overview
Estonian registry entity acting as the corporate parent for [[ent-organization-01]].
`,
    },
  ];

  const relationships: Relationship[] = [
    {
      id: 'rel-01',
      type: 'affiliated_with',
      source_entity: 'ent-person-01',
      target_entity: 'ent-location-01',
      directed: true,
      status: 'confirmed',
      confidence: 95,
      created_at: now,
      evidence: ['src-01'],
      markdownBody: 'Subject Elena Rostova operates as station chief at the London HQ facility.',
    },
    {
      id: 'rel-02',
      type: 'manages',
      source_entity: 'ent-person-01',
      target_entity: 'ent-account-01',
      directed: true,
      status: 'confirmed',
      confidence: 90,
      created_at: now,
      evidence: ['src-03'],
      markdownBody: 'Administrator rights for the Telegram bot verified through cryptographic signatures.',
    },
    {
      id: 'rel-03',
      type: 'investigating',
      source_entity: 'ent-person-01',
      target_entity: 'ent-organization-01',
      directed: true,
      status: 'supported',
      confidence: 88,
      created_at: now,
      evidence: ['src-01'],
      markdownBody: 'Direct investigation target for anomalous fund movements.',
    },
    {
      id: 'rel-04',
      type: 'owns',
      source_entity: 'ent-organization-01',
      target_entity: 'ent-crypto-01',
      directed: true,
      status: 'confirmed',
      confidence: 92,
      created_at: now,
      evidence: ['src-02'],
      markdownBody: 'Corporate charter references multi-signature escrow holding bc1qar0s...',
    },
    {
      id: 'rel-05',
      type: 'operates',
      source_entity: 'ent-organization-01',
      target_entity: 'ent-domain-01',
      directed: true,
      status: 'unverified',
      confidence: 75,
      created_at: now,
      evidence: ['src-03'],
      markdownBody: 'WHOIS billing address correlates with corporate filing address.',
    },
    {
      id: 'rel-06',
      type: 'resolves_to',
      source_entity: 'ent-domain-01',
      target_entity: 'ent-ip-01',
      directed: true,
      status: 'confirmed',
      confidence: 99,
      created_at: now,
      evidence: ['src-03'],
      markdownBody: 'Active DNS A record resolution verified.',
    },
    {
      id: 'rel-07',
      type: 'subsidiary_of',
      source_entity: 'ent-organization-01',
      target_entity: 'ent-company-01',
      directed: true,
      status: 'confirmed',
      confidence: 95,
      created_at: now,
      evidence: ['src-01'],
      markdownBody: 'Companies House filing declares Nordic Security & Intelligence OU as ultimate beneficial owner.',
    },
  ];

  const sources: Source[] = [
    {
      id: 'src-01',
      type: 'source',
      title: 'Companies House Official Registration Filing',
      url: 'https://find-and-update.company-information.service.gov.uk/company/OC348912',
      accessed_at: now,
      source_type: 'registry',
      markdownBody: `# Companies House Filing Extract

## Document Metadata
- Registration Code: OC348912
- Legal Jurisdiction: England and Wales
- Declared Director: Elena Rostova
- Shareholder: Nordic Security & Intelligence OU
`,
    },
    {
      id: 'src-02',
      type: 'source',
      title: 'Blockchain Ledger Transaction Audit',
      url: 'https://mempool.space/address/bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
      accessed_at: now,
      source_type: 'document',
      markdownBody: `# Blockchain Ledger Transaction Audit

## On-Chain Verification
- Target Address: bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq
- Confirmed UTXOs: 142.50 BTC
- Correlated escrow transactions signed by operational keys.
`,
    },
    {
      id: 'src-03',
      type: 'source',
      title: 'Passive DNS & WHOIS Archival Extract',
      url: 'https://securitytrails.com/domain/secure-drop.osint-preview.net',
      accessed_at: now,
      source_type: 'webpage',
      markdownBody: `# Passive DNS History

- Target: secure-drop.osint-preview.net
- Nameservers: Cloudflare
- Historical A-records matched 198.51.100.42.
`,
    },
  ];

  const notes: Note[] = [
    {
      id: 'note-01',
      type: 'note',
      title: 'Tutorial: Graph Exploration & Physics Controls',
      tags: ['tutorial', 'graph', 'physics'],
      created_at: now,
      updated_at: now,
      markdownBody: `# 🌐 Tutorial: Graph Exploration & Physics Controls

This note appears directly as a node on the **Interactive Graph**!

## How to explore the graph:
1. Click the **Interactive Graph** tab.
2. In the top-right toolbar, ensure the **Notes** icon is active to see this note.
3. **Physics in Action**: Drag [[ent-person-01]] or [[ent-location-01]]. Watch other nodes gently push and bounce away from your cursor!
4. **Layout Switching**: Try switching between **COSE**, **Concentric**, and **Breadthfirst** layout modes from the layout buttons in the graph controls.
5. **Right-Click Context Menu**: Right-click any node or link to open quick actions (pin tab, link entities, copy ID).
`,
    },
    {
      id: 'note-02',
      type: 'note',
      title: 'Tutorial: Connecting Evidence with Wikilinks',
      tags: ['tutorial', 'wikilinks', 'evidence'],
      created_at: now,
      updated_at: now,
      markdownBody: `# 🔗 Tutorial: Connecting Evidence with Wikilinks

Trace features automatic bi-directional entity cross-referencing using **Wikilinks syntax**.

## How Wikilinks work:
Whenever you write notes, reports, or source summaries, simply type \`[[\` followed by the ID or title of an entity:

- For example: [[ent-organization-01]] controls the digital wallet [[ent-crypto-01]].
- The graph engine automatically scans markdown files for these links and establishes interactive graph edges between your notes and relevant entities!
`,
    },
  ];

  return { project, entities, relationships, sources, notes };
}
