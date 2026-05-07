/**
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Diverse data for realistic search/filter testing
const names = [
  'Load Balancer',
  'API Gateway',
  'Database Server',
  'Cache Server',
  'Web Server',
  'Application Server',
  'Message Queue',
  'File Server',
  'Mail Server',
  'DNS Server',
  'Proxy Server',
  'Authentication Service',
  'Storage Service',
  'Backup Server',
  'Monitor Service',
];

const protocols = [
  'HTTP',
  'HTTPS',
  'FTP',
  'SFTP',
  'TCP',
  'UDP',
  'SMTP',
  'IMAP',
  'SSH',
  'RDP',
];

const statuses = [
  'Active',
  'Inactive',
  'Starting',
  'Stopping',
  'Disabled',
  'Maintenance',
  'Error',
  'Warning',
];

const regions = [
  'US East',
  'US West',
  'EU Central',
  'EU West',
  'Asia Pacific',
  'South America',
  'Canada',
  'Australia',
];

const environments = ['Production', 'Staging', 'Development', 'Testing', 'QA'];

const rules = [
  'Round robin',
  'Least connections',
  'IP hash',
  'Weighted round robin',
  'Random',
  'Least response time',
  'Source IP',
  'URL hash',
];

const groups = [
  "Kevin's VM Groups",
  "Sarah's Container Cluster",
  "Mike's Kubernetes Pods",
  "Lisa's Docker Swarm",
  "Tom's EC2 Instances",
  "Anna's Azure VMs",
  "John's GCP Compute",
  "Emma's Lambda Functions",
];

/**
 * Generate diverse test data for realistic search/filter scenarios
 */
export const generateRows = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `row-${i}`,
    name: `${names[i % names.length]} ${Math.floor(i / names.length) + 1}`,
    protocol: protocols[i % protocols.length],
    port: 3000 + (i % 100),
    rule: rules[i % rules.length],
    attached_groups: groups[i % groups.length],
    status: statuses[i % statuses.length],
    region: regions[i % regions.length],
    environment: environments[i % environments.length],
  }));
};
