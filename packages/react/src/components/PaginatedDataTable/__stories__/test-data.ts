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
 * Optimized for performance with large datasets
 * @param {number} count - Number of rows to generate
 * @param {number} startIndex - Starting index for row IDs (default: 0)
 * @returns {Array} Array of generated row objects
 */
export const generateRows = (count: number, startIndex = 0) => {
  const rows = new Array(count);
  
  for (let i = 0; i < count; i++) {
    const idx = startIndex + i;
    rows[i] = {
      id: `row-${idx}`,
      name: `${names[idx % names.length]} ${Math.floor(idx / names.length) + 1}`,
      protocol: protocols[idx % protocols.length],
      port: 3000 + (idx % 100),
      rule: rules[idx % rules.length],
      attached_groups: groups[idx % groups.length],
      status: statuses[idx % statuses.length],
      region: regions[idx % regions.length],
      environment: environments[idx % environments.length],
    };
  }
  
  return rows;
};
