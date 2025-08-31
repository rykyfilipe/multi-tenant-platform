import { legalConfig, getCompanyAddress, getFullCompanyName } from '@/lib/legal-config'

export default function ServiceLevelAgreementPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-lg max-w-none">
        <h1 className="text-4xl font-bold text-foreground mb-8">Service Level Agreement</h1>
        
        <div className="text-sm text-muted-foreground mb-8">
          <p><strong>Last updated:</strong> {legalConfig.dates.lastUpdated}</p>
          <p><strong>Effective date:</strong> {legalConfig.dates.effectiveDate}</p>
          <p><strong>Version:</strong> {legalConfig.dates.version}</p>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg mb-8">
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            <strong>Service Commitment:</strong> This Service Level Agreement (SLA) defines our commitment to providing reliable, 
            high-quality service to our customers. It outlines our uptime guarantees, support response times, and service credits for any failures to meet these commitments.
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">1. Definitions</h2>
            <div className="space-y-4 text-foreground">
              <p>For the purposes of this SLA:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>"Service"</strong> means the {legalConfig.company.name} {legalConfig.platform.serviceDescription}</li>
                <li><strong>"Uptime"</strong> means the percentage of time the Service is available for use</li>
                <li><strong>"Downtime"</strong> means any period when the Service is unavailable</li>
                <li><strong>"Scheduled Maintenance"</strong> means planned maintenance windows communicated in advance</li>
                <li><strong>"Emergency Maintenance"</strong> means urgent maintenance required for security or stability</li>
                <li><strong>"Service Credit"</strong> means a credit applied to your account for SLA failures</li>
                <li><strong>"Response Time"</strong> means the time from issue report to initial response</li>
                <li><strong>"Resolution Time"</strong> means the time from issue report to issue resolution</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">2. Service Availability</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3">2.1 Uptime Guarantee</h3>
            <div className="space-y-4 text-foreground">
              <p>We guarantee the following uptime levels based on your subscription plan:</p>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border border-border p-3 text-left font-semibold">Plan</th>
                      <th className="border border-border p-3 text-left font-semibold">Uptime Guarantee</th>
                      <th className="border border-border p-3 text-left font-semibold">Maximum Monthly Downtime</th>
                      <th className="border border-border p-3 text-left font-semibold">Service Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-border p-3">Free</td>
                      <td className="border border-border p-3">99.0%</td>
                      <td className="border border-border p-3">7.2 hours</td>
                      <td className="border border-border p-3">N/A</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">Starter</td>
                      <td className="border border-border p-3">99.5%</td>
                      <td className="border border-border p-3">3.6 hours</td>
                      <td className="border border-border p-3">10%</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">Professional</td>
                      <td className="border border-border p-3">99.7%</td>
                      <td className="border border-border p-3">2.2 hours</td>
                      <td className="border border-border p-3">15%</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">Enterprise</td>
                      <td className="border border-border p-3">99.9%</td>
                      <td className="border border-border p-3">0.7 hours</td>
                      <td className="border border-border p-3">25%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">2.2 Uptime Calculation</h3>
            <div className="space-y-4 text-foreground">
              <p>Uptime is calculated as follows:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Measurement Period:</strong> Monthly (30-day rolling period)</li>
                <li><strong>Uptime Formula:</strong> (Total Minutes - Downtime Minutes) / Total Minutes × 100</li>
                <li><strong>Exclusions:</strong> Scheduled maintenance, emergency maintenance, and force majeure events</li>
                <li><strong>Monitoring:</strong> Continuous monitoring with 5-minute check intervals</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">2.3 Downtime Classification</h3>
            <div className="space-y-4 text-foreground">
              <p>Downtime is classified based on severity:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Critical:</strong> Complete service unavailability affecting all users</li>
                <li><strong>Major:</strong> Significant service degradation affecting most users</li>
                <li><strong>Minor:</strong> Limited service issues affecting some users</li>
                <li><strong>Degraded:</strong> Reduced performance or functionality</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">3. Support Response Times</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3">3.1 Support Tiers</h3>
            <div className="space-y-4 text-foreground">
              <p>We provide different support levels based on your subscription plan:</p>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border border-border p-3 text-left font-semibold">Support Level</th>
                      <th className="border border-border p-3 text-left font-semibold">Response Time</th>
                      <th className="border border-border p-3 text-left font-semibold">Resolution Time</th>
                      <th className="border border-border p-3 text-left font-semibold">Channels</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-border p-3">Community</td>
                      <td className="border border-border p-3">24 hours</td>
                      <td className="border border-border p-3">Best effort</td>
                      <td className="border border-border p-3">Help Center, Community Forum</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">Email</td>
                      <td className="border border-border p-3">8 hours</td>
                      <td className="border border-border p-3">24 hours</td>
                      <td className="border border-border p-3">Email Support</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">Priority</td>
                      <td className="border border-border p-3">4 hours</td>
                      <td className="border border-border p-3">12 hours</td>
                      <td className="border border-border p-3">Email, Live Chat</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">Premium</td>
                      <td className="border border-border p-3">2 hours</td>
                      <td className="border border-border p-3">8 hours</td>
                      <td className="border border-border p-3">Email, Live Chat, Phone</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">Enterprise</td>
                      <td className="border border-border p-3">1 hour</td>
                      <td className="border border-border p-3">4 hours</td>
                      <td className="border border-border p-3">Dedicated Support, Phone, On-site</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">3.2 Issue Severity Levels</h3>
            <div className="space-y-4 text-foreground">
              <p>Issues are classified by severity to determine response priorities:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>P1 (Critical):</strong> Complete service outage affecting all users</li>
                <li><strong>P2 (High):</strong> Major functionality unavailable or severely degraded</li>
                <li><strong>P3 (Medium):</strong> Minor functionality issues or performance problems</li>
                <li><strong>P4 (Low):</strong> Cosmetic issues, feature requests, or general questions</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">4. Maintenance and Updates</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3">4.1 Scheduled Maintenance</h3>
            <div className="space-y-4 text-foreground">
              <p>We perform scheduled maintenance during low-traffic periods:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Frequency:</strong> Monthly, typically on weekends</li>
                <li><strong>Duration:</strong> Maximum 4 hours per maintenance window</li>
                <li><strong>Notification:</strong> 7 days advance notice via email and platform notifications</li>
                <li><strong>Impact:</strong> Minimal to no service interruption</li>
                <li><strong>Compensation:</strong> No service credits for scheduled maintenance</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">4.2 Emergency Maintenance</h3>
            <div className="space-y-4 text-foreground">
              <p>Emergency maintenance may be required for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Security Patches:</strong> Critical security vulnerabilities</li>
                <li><strong>Bug Fixes:</strong> Critical functionality issues</li>
                <li><strong>Infrastructure:</strong> Hardware or network failures</li>
                <li><strong>Compliance:</strong> Regulatory or legal requirements</li>
              </ul>
              <p>Emergency maintenance will be communicated as soon as possible, typically 2-4 hours in advance.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">5. Performance Standards</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3">5.1 Response Time Guarantees</h3>
            <div className="space-y-4 text-foreground">
              <p>We guarantee the following performance metrics:</p>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border border-border p-3 text-left font-semibold">Metric</th>
                      <th className="border border-border p-3 text-left font-semibold">Target</th>
                      <th className="border border-border p-3 text-left font-semibold">Measurement</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-border p-3">Page Load Time</td>
                      <td className="border border-border p-3">&lt; 2 seconds</td>
                      <td className="border border-border p-3">95th percentile</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">API Response Time</td>
                      <td className="border border-border p-3">&lt; 500ms</td>
                      <td className="border border-border p-3">95th percentile</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">Database Query Time</td>
                      <td className="border border-border p-3">&lt; 100ms</td>
                      <td className="border border-border p-3">95th percentile</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">File Upload Time</td>
                      <td className="border border-border p-3">&lt; 5 seconds (10MB)</td>
                      <td className="border border-border p-3">90th percentile</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">5.2 Scalability Commitments</h3>
            <div className="space-y-4 text-foreground">
              <p>Our platform is designed to scale with your needs:</p>
              <ul className="list-disc pl-6 space-y-2">
                								<li><strong>Concurrent Users:</strong> Support for up to {legalConfig.policies.concurrentUsers} concurrent users per tenant</li>
								<li><strong>Data Volume:</strong> Handle up to {legalConfig.policies.dataVolume} records per table</li>
								<li><strong>API Rate Limits:</strong> {legalConfig.policies.apiRateLimit} requests per minute per API key</li>
								<li><strong>Storage Growth:</strong> Automatic scaling up to {legalConfig.policies.storageGrowth} per month included</li>
								<li><strong>Database Tables:</strong> Up to {legalConfig.policies.maxTablesPerDatabase} tables per database</li>
								<li><strong>Table Columns:</strong> Up to {legalConfig.policies.maxColumnsPerTable} columns per table</li>
								<li><strong>Table Rows:</strong> Up to {legalConfig.policies.maxRowsPerTable} rows per table (configurable)</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">5.3 Platform-Specific Service Levels</h3>
            <div className="space-y-4 text-foreground">
              <p>Our multi-tenant database platform provides the following specialized service levels:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Database Operations:</strong> 99.9% uptime for database creation, modification, and deletion</li>
                <li><strong>Data Import/Export:</strong> Support for files up to 100MB with 95% success rate</li>
                <li><strong>API Availability:</strong> 99.5% uptime for REST API endpoints</li>
                <li><strong>Real-time Collaboration:</strong> Sub-second synchronization for multi-user editing</li>
                <li><strong>Dashboard Rendering:</strong> &lt; 3 second load time for complex dashboards</li>
                <li><strong>Permission Updates:</strong> Real-time propagation of user permission changes</li>
                <li><strong>Data Backup:</strong> {legalConfig.policies.backupFrequency} with 30-day retention</li>
                <li><strong>SSL Encryption:</strong> {legalConfig.policies.sslEncryption}</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">6. Data Protection and Security</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3">6.1 Backup and Recovery</h3>
            <div className="space-y-4 text-foreground">
              <p>We implement comprehensive data protection measures:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Backup Frequency:</strong> Daily automated backups</li>
                <li><strong>Backup Retention:</strong> 30 days of daily backups, 12 months of weekly backups</li>
                <li><strong>Recovery Time Objective (RTO):</strong> 4 hours for full service restoration</li>
                <li><strong>Recovery Point Objective (RPO):</strong> 24 hours maximum data loss</li>
                <li><strong>Geographic Redundancy:</strong> Backups stored in multiple data centers</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">6.2 Security Standards</h3>
            <div className="space-y-4 text-foreground">
              <p>We maintain industry-leading security practices:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Data Encryption:</strong> AES-256 encryption at rest and TLS 1.3 in transit</li>
                <li><strong>Access Controls:</strong> Role-based access control and multi-factor authentication</li>
                <li><strong>Security Audits:</strong> Annual third-party security assessments</li>
                <li><strong>Vulnerability Management:</strong> Regular security scans and patch management</li>
                <li><strong>Incident Response:</strong> 24/7 security monitoring and incident response</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">7. Service Credits</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3">7.1 Credit Calculation</h3>
            <div className="space-y-4 text-foreground">
              <p>Service credits are calculated based on downtime duration:</p>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border border-border p-3 text-left font-semibold">Uptime Level</th>
                      <th className="border border-border p-3 text-left font-semibold">Credit Percentage</th>
                      <th className="border border-border p-3 text-left font-semibold">Maximum Credit</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-border p-3">99.0% - 99.4%</td>
                      <td className="border border-border p-3">10%</td>
                      <td className="border border-border p-3">25% of monthly fee</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">98.0% - 98.9%</td>
                      <td className="border border-border p-3">25%</td>
                      <td className="border border-border p-3">50% of monthly fee</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">95.0% - 97.9%</td>
                      <td className="border border-border p-3">50%</td>
                      <td className="border border-border p-3">75% of monthly fee</td>
                    </tr>
                    <tr>
                      <td className="border border-border p-3">Below 95.0%</td>
                      <td className="border border-border p-3">100%</td>
                      <td className="border border-border p-3">100% of monthly fee</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">7.2 Credit Application</h3>
            <div className="space-y-4 text-foreground">
              <p>Service credits are applied as follows:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Automatic Calculation:</strong> Credits calculated automatically based on monitoring data</li>
                <li><strong>Application Timeline:</strong> Credits applied within 30 days of the incident</li>
                <li><strong>Credit Form:</strong> Applied as a reduction to your next billing cycle</li>
                <li><strong>Maximum Credit:</strong> Limited to the monthly fee for the affected period</li>
                <li><strong>Multiple Incidents:</strong> Credits are cumulative but capped at monthly fee</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">8. Monitoring and Reporting</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3">8.1 Real-Time Monitoring</h3>
            <div className="space-y-4 text-foreground">
              <p>We provide comprehensive monitoring and reporting:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Uptime Dashboard:</strong> Real-time service status and performance metrics</li>
                <li><strong>Performance Analytics:</strong> Detailed performance data and trends</li>
                <li><strong>Alert System:</strong> Proactive notifications for potential issues</li>
                <li><strong>Incident Timeline:</strong> Detailed incident reports and resolution updates</li>
                <li><strong>Historical Data:</strong> 12 months of performance and availability data</li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">8.2 Monthly Reports</h3>
            <div className="space-y-4 text-foreground">
              <p>Monthly SLA reports include:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Uptime Summary:</strong> Monthly uptime percentage and comparison to SLA</li>
                <li><strong>Incident Summary:</strong> Number and duration of incidents</li>
                <li><strong>Performance Metrics:</strong> Response times and throughput data</li>
                <li><strong>Service Credits:</strong> Credits earned and applied</li>
                <li><strong>Maintenance Summary:</strong> Scheduled and emergency maintenance details</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">9. Exclusions and Limitations</h2>
            <div className="space-y-4 text-foreground">
              <p>This SLA does not cover:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Force Majeure Events:</strong> Natural disasters, war, terrorism, or government actions</li>
                <li><strong>Third-Party Services:</strong> Issues with external integrations or services</li>
                <li><strong>User Actions:</strong> Problems caused by user configuration or usage</li>
                <li><strong>Network Issues:</strong> Internet connectivity problems outside our control</li>
                <li><strong>Beta Features:</strong> Experimental or preview functionality</li>
                <li><strong>Custom Development:</strong> Issues with custom integrations or modifications</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">10. SLA Claims and Disputes</h2>
            
            <h3 className="text-xl font-semibold text-foreground mb-3">10.1 Claim Process</h3>
            <div className="space-y-4 text-foreground">
              <p>To claim service credits:</p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Submit a claim within 30 days of the incident</li>
                <li>Include incident details, dates, and impact description</li>
                <li>Provide any supporting documentation or evidence</li>
                <li>Allow 5 business days for review and response</li>
                <li>Receive written decision with credit calculation</li>
              </ol>
            </div>

            <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">10.2 Dispute Resolution</h3>
            <div className="space-y-4 text-foreground">
              <p>If you disagree with our SLA determination:</p>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Submit a written appeal within 15 days</li>
                <li>Provide additional evidence or documentation</li>
                <li>Allow 10 business days for review</li>
                <li>Receive final decision from senior management</li>
                <li>Escalate to binding arbitration if necessary</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">11. Updates to This SLA</h2>
            <div className="space-y-4 text-foreground">
              <p>We may update this SLA from time to time:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Advance Notice:</strong> 30 days notice for material changes</li>
                <li><strong>Grandfathering:</strong> Existing customers may be grandfathered under previous terms</li>
                <li><strong>Improvements:</strong> Changes that improve service levels are effective immediately</li>
                <li><strong>Communication:</strong> Updates communicated via email and platform notifications</li>
                <li><strong>Version Control:</strong> All versions archived and accessible for reference</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-foreground mb-4">12. Contact Information</h2>
            <div className="space-y-4 text-foreground">
              <p>For SLA-related questions and claims:</p>
              
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p><strong>SLA Team:</strong></p>
                <p>Email: {legalConfig.company.email.sla}</p>
                <p>Phone: {legalConfig.company.phone}</p>
                <p>Hours: Monday-Friday, 9:00 AM - 6:00 PM {legalConfig.company.timezone}</p>
              </div>

              <div className="bg-muted/50 p-4 rounded-lg space-y-2 mt-4">
                <p><strong>Emergency Support:</strong></p>
                <p>Phone: {legalConfig.company.phone} (24/7)</p>
                <p>Email: {legalConfig.company.email.emergency}</p>
                <p>Escalation: {legalConfig.company.email.escalation}</p>
              </div>

              <p className="text-sm text-muted-foreground mt-4">
                <strong>Note:</strong> For urgent SLA issues, please use the emergency contact number provided above.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
