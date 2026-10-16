import { Entity, Note, Project, ProjectData, Relationship, Source } from '@/types';

export function createSampleProject(): ProjectData {
  const now = new Date().toISOString();

  const project: Project = {
    id: 'project-nightfall',
    type: 'project',
    name: 'Operation Nightfall — Threat Actor Profiling',
    created_at: now,
    updated_at: now,
    markdownBody: `# Operation Nightfall

## Objective
Investigate the cyber infrastructure, shell corporate registrations, and operational identities behind the dark marketplace mirror \`nightmarket-vault.cc\` and identify beneficial owners.

## Key Findings
- Subject Alexei Morozov identified via historical whois record matching proton.me email address.
- Shell corporation *Nordic Cyber Shield OU* in Estonia acts as registrant billing shield.
- Operational Telegram channel publishes mirrors and PGP signed updates matching on-chain escrow addresses.
`,
  };

  const entities: Entity[] = [
    {
      id: 'ent-person-01',
      type: 'person',
      name: 'Alexei "Kestrel" Morozov',
      aliases: ['kestrel_ops', 'moroz_sec', 'Алексей Морозов'],
      created_at: now,
      updated_at: now,
      tags: ['subject-of-interest', 'operator', 'tier-1'],
      attributes: {
        nationality: 'Russian / Estonian e-Resident',
        timezone: 'UTC+3',
        pgp_fingerprint: '4E9B 81A2 DF09 C321',
        primary_handle: 'kestrel_ops',
        photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
      markdownBody: `# Alexei "Kestrel" Morozov

## Summary
Suspected administrator and key infrastructure operator for the NightMarket syndication network. Identified through overlapping domain registrant credentials and operational security lapses in PGP key distribution.

## Findings
- Consistently active during Eastern European business hours.
- PGP key signed multiple release manifestos distributed on underground Telegram channels.
- Listed as board member of an Estonian registry entity.

## Sources
- [[src-05]] Estonian Business e-Register Filing
- [[src-01]] Telegram Broadcast Channel Dump
`,
    },
    {
      id: 'ent-account-01',
      type: 'account',
      name: '@kestrel_dev',
      aliases: ['t.me/kestrel_dev'],
      created_at: now,
      updated_at: now,
      tags: ['social', 'telegram', 'broadcast'],
      attributes: {
        platform: 'Telegram',
        channel_id: '-10018920192',
        subscriber_count: 4200,
        creation_date: '2023-04-12',
      },
      markdownBody: `# @kestrel_dev

## Summary
Public Telegram broadcast channel publishing infrastructure migration announcements, mirror links, and cryptographic proofs for the operation.

## Findings
Channel bio contains a signed statement referencing \`nightmarket-vault.cc\`.
`,
    },
    {
      id: 'ent-email-01',
      type: 'email',
      name: 'morozov.ops@proton.me',
      aliases: [],
      created_at: now,
      updated_at: now,
      tags: ['contact', 'protonmail', 'infrastructure'],
      attributes: {
        provider: 'Proton AG',
        recovery_email_hint: 'a****v@mail.ru',
      },
      markdownBody: `# morozov.ops@proton.me

## Summary
Encrypted email address found in historic WHOIS records for domain registration.
`,
    },
    {
      id: 'ent-domain-01',
      type: 'domain',
      name: 'nightmarket-vault.cc',
      aliases: ['www.nightmarket-vault.cc'],
      created_at: now,
      updated_at: now,
      tags: ['infrastructure', 'c2', 'clearnet-mirror'],
      attributes: {
        registrar: 'Njalla / 1337 Services LLC',
        tld: '.cc',
        registered_on: '2023-11-04',
      },
      markdownBody: `# nightmarket-vault.cc

## Summary
Clearnet portal functioning as a reverse proxy fronting hidden onion services. Resolves to bulletproof hosting IP.
`,
    },
    {
      id: 'ent-ip-01',
      type: 'ip',
      name: '185.220.101.45',
      aliases: [],
      created_at: now,
      updated_at: now,
      tags: ['vps', 'bulletproof', 'network'],
      attributes: {
        asn: 'AS200052',
        isp: 'FlokiNET ehf',
        city: 'Amsterdam',
        country: 'Netherlands',
      },
      markdownBody: `# 185.220.101.45

## Summary
Dedicated server hosted in an offshore bulletproof data facility. Multiple abuse complaints on record without remediation.
`,
    },
    {
      id: 'ent-company-01',
      type: 'company',
      name: 'Nordic Cyber Shield OU',
      aliases: ['Nordic Cyber Shield Private Limited'],
      created_at: now,
      updated_at: now,
      tags: ['shell-company', 'corporate-vehicle', 'estonia'],
      attributes: {
        registration_number: '16492019',
        jurisdiction: 'Estonia',
        capital: '2500 EUR',
        vat_id: 'EE102492102',
      },
      markdownBody: `# Nordic Cyber Shield OU

## Summary
Estonian private limited company registered in May 2022. Used to sign vendor contracts with European hosting providers and cloud protection services.
`,
    },
    {
      id: 'ent-location-01',
      type: 'location',
      name: 'Tallinn, Estonia',
      aliases: ['Harju maakond, Tallinn'],
      created_at: now,
      updated_at: now,
      tags: ['geographic', 'registration-seat'],
      attributes: {
        country: 'Estonia',
        address: 'Viru väljak 4, 10111 Tallinn, Estonia',
        coordinates: '59.4370° N, 24.7536° E',
      },
      markdownBody: `# Tallinn, Estonia

Registered address seat for legal entity [[ent-company-01]].
`,
    },
    {
      id: 'ent-crypto-01',
      type: 'custom',
      custom_type: 'Crypto Wallet',
      name: 'bc1q9e5z7x3y4w2p10a8d6f',
      aliases: ['Escrow Wallet #4'],
      created_at: now,
      updated_at: now,
      tags: ['financial', 'bitcoin', 'escrow'],
      attributes: {
        asset: 'BTC',
        total_received: '42.85 BTC',
        first_tx: '2023-12-01',
      },
      markdownBody: `# bc1q9e5z7x3y4w2p10a8d6f

## Summary
On-chain Bitcoin address posted on dark web escrow deposit contracts.
`,
    },
    {
      id: 'ent-org-01',
      type: 'organization',
      name: 'ShadowMesh Syndicate',
      aliases: ['Mesh Group'],
      created_at: now,
      updated_at: now,
      tags: ['threat-actor-group', 'unconfirmed'],
      attributes: {
        alleged_origin: 'Eastern Europe',
        motive: 'Financial extortion & illicit commerce',
      },
      markdownBody: `# ShadowMesh Syndicate

Broader cybercrime network suspected of providing initial access broker feeds to NightMarket operators.
`,
    },
  ];

  const relationships: Relationship[] = [
    {
      id: 'rel-01',
      type: 'operates',
      source_entity: 'ent-person-01',
      target_entity: 'ent-account-01',
      directed: true,
      status: 'confirmed',
      confidence: 95,
      evidence: ['src-01'],
      created_at: now,
      markdownBody: `# Relationship: operates

## Explanation
Alexei Morozov controls the Telegram broadcast channel based on administrator username match and PGP key signatures.

## Evidence
Documented in source [[src-01]].
`,
    },
    {
      id: 'rel-02',
      type: 'associated_with',
      source_entity: 'ent-person-01',
      target_entity: 'ent-email-01',
      directed: false,
      status: 'confirmed',
      confidence: 90,
      evidence: ['src-03'],
      created_at: now,
      markdownBody: `# Relationship: associated_with

Email address matches subject's surname and was used in domain registration contact forms.
`,
    },
    {
      id: 'rel-03',
      type: 'registered',
      source_entity: 'ent-email-01',
      target_entity: 'ent-domain-01',
      directed: true,
      status: 'supported',
      confidence: 85,
      evidence: ['src-03'],
      created_at: now,
      markdownBody: `# Relationship: registered

Historical WHOIS snapshot from November 2023 shows domain \`nightmarket-vault.cc\` registered under \`morozov.ops@proton.me\`.
`,
    },
    {
      id: 'rel-04',
      type: 'resolves_to',
      source_entity: 'ent-domain-01',
      target_entity: 'ent-ip-01',
      directed: true,
      status: 'confirmed',
      confidence: 100,
      evidence: ['src-04'],
      created_at: now,
      markdownBody: `# Relationship: resolves_to

DNS A record verified through passive DNS queries over multiple weeks.
`,
    },
    {
      id: 'rel-05',
      type: 'director_of',
      source_entity: 'ent-person-01',
      target_entity: 'ent-company-01',
      directed: true,
      status: 'confirmed',
      confidence: 100,
      evidence: ['src-05'],
      created_at: now,
      markdownBody: `# Relationship: director_of

Official registry filing lists Alexei Morozov as sole legal representative and board member.
`,
    },
    {
      id: 'rel-06',
      type: 'located_at',
      source_entity: 'ent-company-01',
      target_entity: 'ent-location-01',
      directed: true,
      status: 'confirmed',
      confidence: 95,
      evidence: ['src-05'],
      created_at: now,
      markdownBody: `# Relationship: located_at

Company legal registration address is registered in Tallinn, Harju county.
`,
    },
    {
      id: 'rel-07',
      type: 'promotes',
      source_entity: 'ent-account-01',
      target_entity: 'ent-domain-01',
      directed: true,
      status: 'supported',
      confidence: 80,
      evidence: ['src-01'],
      created_at: now,
      markdownBody: `# Relationship: promotes

Pinned posts on channel @kestrel_dev direct users to \`nightmarket-vault.cc\`.
`,
    },
    {
      id: 'rel-08',
      type: 'collaborates_with',
      source_entity: 'ent-account-01',
      target_entity: 'ent-org-01',
      directed: false,
      status: 'candidate',
      confidence: 40,
      evidence: ['src-01'],
      created_at: now,
      markdownBody: `# Relationship: collaborates_with

## Explanation
Candidate relationship based on frequent re-posts of leak announcements from ShadowMesh channels. Needs further evidence before confirmation.
`,
    },
    {
      id: 'rel-09',
      type: 'finances',
      source_entity: 'ent-crypto-01',
      target_entity: 'ent-company-01',
      directed: true,
      status: 'unverified',
      confidence: 65,
      evidence: ['src-02'],
      created_at: now,
      markdownBody: `# Relationship: finances

Blockchain analysis shows cluster transactions flowing from escrow address to a crypto card service used by Nordic Cyber Shield OU.
`,
    },
  ];

  const sources: Source[] = [
    {
      id: 'src-01',
      type: 'source',
      title: 'Telegram Broadcast Channel Archive',
      url: 'https://t.me/kestrel_dev',
      accessed_at: now,
      source_type: 'social_post',
      markdownBody: `# Telegram Broadcast Channel Archive

## Extract
> "NightMarket Clearnet Gateway migrated to \`nightmarket-vault.cc\` with bulletproof redundancy. Verify PGP fingerprint: 4E9B 81A2 DF09 C321 before depositing."

## Notes
Provides direct link between handle @kestrel_dev, domain, and PGP key.
`,
    },
    {
      id: 'src-02',
      type: 'source',
      title: 'Blockchain Forensic Graph Report #2024-08',
      accessed_at: now,
      source_type: 'document',
      markdownBody: `# Blockchain Forensic Graph Report

## Extract
Analysis of 42.85 BTC received by \`bc1q9e5z7x3y4w2p10a8d6f\` shows hop outputs interacting with virtual IBAN debit card issuers.
`,
    },
    {
      id: 'src-03',
      type: 'source',
      title: 'Historical WHOIS Archive Snapshot',
      url: 'https://whoisology.com/archive/nightmarket-vault.cc',
      accessed_at: now,
      source_type: 'registry',
      markdownBody: `# Historical WHOIS Archive Snapshot

## Extract
Record for \`nightmarket-vault.cc\` prior to privacy protection enable:
Registrant Contact: \`morozov.ops@proton.me\`
Registration date: 2023-11-04
`,
    },
    {
      id: 'src-04',
      type: 'source',
      title: 'DNS Resolution Telemetry',
      url: 'https://securitytrails.com/domain/nightmarket-vault.cc/dns',
      accessed_at: now,
      source_type: 'webpage',
      markdownBody: `# DNS Resolution Telemetry

A record persistently points to 185.220.101.45 (FlokiNET AS200052).
`,
    },
    {
      id: 'src-05',
      type: 'source',
      title: 'Estonian Business e-Register Company Record',
      url: 'https://ariregister.rik.ee/eng/company/16492019',
      accessed_at: now,
      source_type: 'registry',
      markdownBody: `# Estonian Business e-Register Company Record

## Extract
Company: Nordic Cyber Shield OU (Registry code: 16492019)
Management Board Member: Alexei Morozov (born 1988)
Address: Narva mnt, Tallinn, 10120 Harju maakond
`,
    },
  ];

  const notes: Note[] = [
    {
      id: 'note-01',
      type: 'note',
      title: 'Investigation Log & Operational Timeline',
      tags: ['timeline', 'log'],
      created_at: now,
      updated_at: now,
      markdownBody: `# Investigation Log & Operational Timeline

## Phase 1 — Infrastructure Discovery
1. Monitored dark web forums announcing clearnet redundancy proxy.
2. Extracted domain \`nightmarket-vault.cc\` and correlated historical DNS and WHOIS records.
3. Uncovered proton email address associated with Russian national Alexei Morozov.

## Phase 2 — Corporate Network Expansion
1. Queried Estonian e-Residency public business register.
2. Discovered shell corporate registration *Nordic Cyber Shield OU*.
3. Next step: trace offshore banking channels and cryptocurrency escrow addresses.
`,
    },
  ];

  return { project, entities, relationships, sources, notes };
}
