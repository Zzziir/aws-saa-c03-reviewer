export interface ServiceItem {
  name: string;
  note: string;
}
export interface ServiceCategory {
  name: string;
  services: ServiceItem[];
}

/**
 * The SAA-C03 in-scope service list with concise "when to use" notes.
 * Notes are exam-oriented one-liners, not full docs.
 */
export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    name: "Compute",
    services: [
      { name: "Amazon EC2", note: "Resizable virtual servers. Choose instance families by workload; use Reserved/Savings Plans for steady, Spot for interruptible." },
      { name: "EC2 Auto Scaling", note: "Automatically add/remove EC2 based on demand or schedule. Span multiple AZs for resilience; use ELB health checks for app-level replacement." },
      { name: "AWS Batch", note: "Fully managed batch computing at any scale; queues jobs onto EC2/Fargate. Use for large-scale scientific/data batch runs." },
      { name: "Elastic Beanstalk", note: "PaaS that provisions and manages EC2, ELB, Auto Scaling for your app. Fast deploys without managing infrastructure." },
      { name: "AWS Outposts", note: "AWS hardware in your own data center for low-latency/local-data-residency needs. Hybrid, on-prem AWS." },
      { name: "AWS Wavelength", note: "Run apps at the 5G network edge for ultra-low latency to mobile users." },
      { name: "VMware Cloud on AWS", note: "Run existing VMware workloads on AWS bare-metal for lift-and-shift migration." },
      { name: "Serverless App Repository", note: "Discover and deploy prebuilt serverless applications/components." },
    ],
  },
  {
    name: "Containers",
    services: [
      { name: "Amazon ECS", note: "AWS-native container orchestration. Pair with Fargate for serverless containers or EC2 for control." },
      { name: "Amazon EKS", note: "Managed Kubernetes. Use when you need the Kubernetes ecosystem/portability." },
      { name: "Amazon ECR", note: "Private container image registry, integrated with ECS/EKS and Inspector image scanning." },
      { name: "ECS/EKS Anywhere", note: "Run ECS/EKS on your own on-prem infrastructure for hybrid consistency." },
      { name: "EKS Distro", note: "The open-source Kubernetes distribution that powers EKS, run anywhere." },
    ],
  },
  {
    name: "Serverless",
    services: [
      { name: "AWS Lambda", note: "Run code without servers; event-driven, pay per invocation. Great for glue, APIs, stream processing. 15-min max." },
      { name: "AWS Fargate", note: "Serverless compute for ECS/EKS containers — no EC2 to manage." },
      { name: "AWS AppSync", note: "Managed GraphQL API with real-time subscriptions and offline sync for apps." },
    ],
  },
  {
    name: "Storage",
    services: [
      { name: "Amazon S3", note: "Object storage, 11 nines durability. Storage classes, lifecycle, versioning, replication, Object Lock. Default for static/backup/data lake." },
      { name: "Amazon S3 Glacier", note: "Low-cost archival tiers (Instant/Flexible/Deep Archive). Use for long-term retention with rare access." },
      { name: "Amazon EBS", note: "Block storage for a single EC2 (AZ-scoped). Snapshots to S3 for backup/cross-AZ. gp3 default; io2 for high IOPS." },
      { name: "Amazon EFS", note: "Elastic NFS shared across many EC2 in multiple AZs (Linux, POSIX). Lifecycle to IA/Archive for cold data." },
      { name: "Amazon FSx", note: "Managed file systems: Windows File Server (SMB/AD), Lustre (HPC), NetApp ONTAP, OpenZFS." },
      { name: "AWS Storage Gateway", note: "Hybrid storage bridging on-prem to AWS: File, Volume, Tape gateways." },
      { name: "AWS Backup", note: "Centralized, policy-based backup across EC2, EBS, RDS, DynamoDB, EFS, FSx; Vault Lock for immutability." },
    ],
  },
  {
    name: "Database",
    services: [
      { name: "Amazon RDS", note: "Managed relational DB (MySQL, PostgreSQL, MariaDB, Oracle, SQL Server). Multi-AZ = HA; read replicas = read scaling." },
      { name: "Amazon Aurora", note: "MySQL/PostgreSQL-compatible; 6 copies across 3 AZs, auto-failover, up to 15 replicas, global database." },
      { name: "Aurora Serverless", note: "Auto-scaling Aurora capacity (v2 = fine-grained, in-place). Use for variable/unpredictable workloads." },
      { name: "Amazon DynamoDB", note: "Serverless NoSQL key-value, single-digit-ms. Global tables (multi-active), DAX cache, streams, on-demand or provisioned." },
      { name: "Amazon ElastiCache", note: "In-memory cache (Redis/Memcached). Offload DB reads, store session state, leaderboards." },
      { name: "Amazon DocumentDB", note: "MongoDB-compatible document database, managed." },
      { name: "Amazon Keyspaces", note: "Managed Apache Cassandra-compatible (wide-column)." },
      { name: "Amazon Neptune", note: "Managed graph database for highly connected data (social, fraud, recommendations)." },
      { name: "Amazon Redshift", note: "Petabyte-scale data warehouse for analytics/OLAP; Spectrum queries S3, Serverless option." },
    ],
  },
  {
    name: "Networking & Content Delivery",
    services: [
      { name: "Amazon VPC", note: "Your private network: subnets, route tables, IGW/NAT, security groups (stateful) vs NACLs (stateless)." },
      { name: "Amazon CloudFront", note: "Global CDN caching content at edge locations. OAC to lock down S3 origins; integrates with WAF, Shield." },
      { name: "Route 53", note: "DNS + health checks + routing policies (failover, latency, weighted, geolocation, geoproximity, multivalue)." },
      { name: "Elastic Load Balancing", note: "ALB (HTTP/L7), NLB (TCP/L4, static IP), GWLB (appliances). Distributes across AZs; health checks." },
      { name: "AWS Global Accelerator", note: "Anycast static IPs routing over AWS backbone to healthy endpoints; fast failover, non-HTTP too." },
      { name: "AWS PrivateLink", note: "Private, service-specific access via interface endpoints — no internet, no CIDR overlap issues." },
      { name: "AWS Transit Gateway", note: "Hub-and-spoke to connect many VPCs and on-prem at scale (transitive routing)." },
      { name: "AWS Direct Connect", note: "Dedicated private link to AWS. Consistent bandwidth; add VPN/MACsec for encryption." },
      { name: "Site-to-Site VPN", note: "IPsec tunnel over the internet between on-prem and VPC (encrypted)." },
      { name: "AWS Client VPN", note: "Managed OpenVPN endpoint for remote users to reach VPC resources." },
    ],
  },
  {
    name: "Security, Identity & Compliance",
    services: [
      { name: "IAM", note: "Users, groups, roles, policies. Explicit Deny > Allow > implicit deny. Prefer roles + least privilege." },
      { name: "IAM Identity Center", note: "Workforce SSO across accounts/apps; permission sets. Successor to AWS SSO." },
      { name: "AWS KMS", note: "Managed encryption keys; CMKs auditable in CloudTrail, yearly rotation. Multi-tenant." },
      { name: "AWS CloudHSM", note: "Single-tenant FIPS 140-2 Level 3 HSM; you alone control keys." },
      { name: "AWS Secrets Manager", note: "Store secrets with native automatic rotation (RDS etc). vs Parameter Store (no rotation)." },
      { name: "AWS Certificate Manager", note: "Free public TLS certs with auto-renewal; attach to ALB/NLB/CloudFront/API Gateway." },
      { name: "Amazon Cognito", note: "User pools = app sign-in/federation (JWT); identity pools = temporary AWS creds via STS." },
      { name: "Amazon GuardDuty", note: "Threat detection from CloudTrail, VPC Flow, DNS logs. Findings, not inline blocking." },
      { name: "Amazon Inspector", note: "Automated vulnerability (CVE) + network reachability scanning for EC2, ECR, Lambda." },
      { name: "Amazon Macie", note: "ML-based sensitive data (PII) discovery in S3." },
      { name: "Amazon Detective", note: "Investigate/root-cause security findings via a behavior graph." },
      { name: "AWS Security Hub", note: "Aggregates findings + compliance checks (CIS, PCI) across accounts (ASFF)." },
      { name: "AWS WAF", note: "L7 filtering (SQLi/XSS, rate limits) on CloudFront, ALB, API Gateway, AppSync." },
      { name: "AWS Shield", note: "DDoS protection. Standard = free L3/L4; Advanced = L7, SRT, cost protection." },
      { name: "AWS Firewall Manager", note: "Org-wide central management of WAF, Shield, security groups, Network Firewall." },
      { name: "AWS Network Firewall", note: "Managed stateful/stateless network filtering for VPC traffic." },
      { name: "AWS Directory Service", note: "Managed Microsoft AD (trusts, FSx/RDS), AD Connector (proxy), Simple AD." },
      { name: "AWS RAM", note: "Share resources (subnets, TGW, Resolver rules) across accounts without duplication." },
      { name: "AWS Artifact", note: "Download AWS compliance reports (SOC, ISO) and accept agreements (BAA)." },
      { name: "AWS Audit Manager", note: "Continuously collect evidence to map workloads to compliance frameworks." },
    ],
  },
  {
    name: "Management & Governance",
    services: [
      { name: "AWS Organizations", note: "Multi-account management; SCPs set max permissions (even for root); consolidated billing." },
      { name: "AWS Control Tower", note: "Automated multi-account landing zone with guardrails + Account Factory." },
      { name: "AWS CloudFormation", note: "Infrastructure as code with templates; repeatable, versioned stacks." },
      { name: "AWS CloudTrail", note: "Records API calls (who/what/when/where). Log file validation + Object Lock for tamper-proof audit." },
      { name: "Amazon CloudWatch", note: "Metrics, logs, alarms, dashboards. Trigger Auto Scaling, alerts, automation." },
      { name: "AWS Config", note: "Records resource configuration + evaluates rules; can auto-remediate drift via SSM." },
      { name: "AWS Systems Manager", note: "Operate fleets: Session Manager (no bastion), Patch Manager, Parameter Store, Automation; hybrid nodes." },
      { name: "AWS Trusted Advisor", note: "Best-practice checks across cost, security, performance, fault tolerance, limits." },
      { name: "AWS Service Catalog", note: "Curate approved, self-service product portfolios for teams." },
      { name: "AWS License Manager", note: "Track and enforce software license usage." },
      { name: "Compute Optimizer", note: "ML right-sizing recommendations for EC2, ASG, EBS, Lambda." },
      { name: "AWS Health Dashboard", note: "Personalized view of AWS events affecting your resources." },
      { name: "Managed Grafana / Prometheus", note: "Managed observability: dashboards (Grafana) and metrics (Prometheus) for containers." },
      { name: "Well-Architected Tool", note: "Review workloads against the 6 pillars and get improvement plans." },
    ],
  },
  {
    name: "Application Integration",
    services: [
      { name: "Amazon SQS", note: "Decoupling message queue (pull). Standard = at-least-once; FIFO = exactly-once + ordering. DLQ for poison messages." },
      { name: "Amazon SNS", note: "Pub/sub push, fan-out to SQS/Lambda/HTTP/email. Combine with SQS for fan-out durability." },
      { name: "Amazon EventBridge", note: "Event bus with routing rules, schedules, SaaS + AWS event sources. Serverless choreography." },
      { name: "AWS Step Functions", note: "Serverless workflow orchestration (state machine) with retries and error handling." },
      { name: "Amazon MQ", note: "Managed ActiveMQ/RabbitMQ for lift-and-shift of standard messaging protocols." },
      { name: "Amazon AppFlow", note: "No-code data transfer between SaaS apps and AWS." },
      { name: "AWS AppSync", note: "Managed GraphQL for real-time and offline app data." },
    ],
  },
  {
    name: "Analytics",
    services: [
      { name: "Amazon Athena", note: "Serverless SQL over S3 data. Pay per scan; partition + Parquet to cut cost. Great for logs/data lake." },
      { name: "AWS Glue", note: "Serverless ETL + Data Catalog. Crawlers infer schema for Athena/Redshift Spectrum." },
      { name: "Amazon Kinesis", note: "Real-time streaming (Data Streams = ordered per shard). For ingest/analytics pipelines." },
      { name: "Amazon Data Firehose", note: "Load streaming data into S3/Redshift/OpenSearch with buffering/transform; near-real-time." },
      { name: "Amazon MSK", note: "Managed Apache Kafka for streaming." },
      { name: "Amazon EMR", note: "Managed Hadoop/Spark big-data processing clusters." },
      { name: "Amazon OpenSearch", note: "Search + log analytics (ELK-style) with dashboards." },
      { name: "Amazon Redshift", note: "Data warehouse for BI/OLAP queries at scale." },
      { name: "Amazon QuickSight", note: "Serverless BI dashboards and visualizations." },
      { name: "AWS Lake Formation", note: "Build/secure data lakes with central fine-grained permissions." },
      { name: "AWS Data Exchange", note: "Find and subscribe to third-party data sets." },
    ],
  },
  {
    name: "Migration & Transfer",
    services: [
      { name: "AWS DMS", note: "Migrate/replicate databases with minimal downtime; homogeneous or heterogeneous (with SCT)." },
      { name: "AWS DataSync", note: "Fast, automated online data transfer to/from S3, EFS, FSx." },
      { name: "AWS Snow Family", note: "Offline bulk transfer via physical devices (Snowcone/Snowball/Edge) for huge data or poor connectivity." },
      { name: "Application Migration Service", note: "Lift-and-shift (rehost) servers to EC2 with block-level replication." },
      { name: "AWS Transfer Family", note: "Managed SFTP/FTPS/FTP into and out of S3/EFS." },
    ],
  },
  {
    name: "Front-End Web & Mobile",
    services: [
      { name: "Amazon API Gateway", note: "Managed REST/HTTP/WebSocket APIs; throttling, auth (IAM/Cognito/Lambda authorizers), caching." },
      { name: "AWS Amplify", note: "Full-stack hosting + backend for web/mobile with CI/CD." },
      { name: "AWS Device Farm", note: "Test apps on real mobile devices in the cloud." },
    ],
  },
  {
    name: "Cost Management",
    services: [
      { name: "AWS Budgets", note: "Set cost/usage budgets with alerts; Budget Actions can apply IAM/SCP or stop EC2/RDS." },
      { name: "AWS Cost Explorer", note: "Visualize and forecast spend; find right-sizing/RI opportunities." },
      { name: "Cost and Usage Report", note: "Most granular billing data, delivered to S3 for analysis." },
      { name: "Savings Plans", note: "Commit to $/hour for 1–3 yrs for large discounts on compute (more flexible than RIs)." },
    ],
  },
  {
    name: "Machine Learning",
    services: [
      { name: "Amazon SageMaker AI", note: "Build, train, deploy ML models end-to-end." },
      { name: "Amazon Rekognition", note: "Image/video analysis: objects, faces, moderation." },
      { name: "Amazon Textract", note: "Extract text/forms/tables from scanned documents." },
      { name: "Amazon Comprehend", note: "NLP: entities, sentiment, PII detection in text." },
      { name: "Amazon Transcribe", note: "Speech-to-text." },
      { name: "Amazon Polly", note: "Text-to-speech." },
      { name: "Amazon Translate", note: "Neural machine translation between languages." },
      { name: "Amazon Lex", note: "Build conversational chatbots/voice bots." },
      { name: "Amazon Kendra", note: "Intelligent enterprise search with natural language." },
    ],
  },
  {
    name: "Media, Dev Tools & Other",
    services: [
      { name: "Elastic Transcoder", note: "Media transcoding to different formats/resolutions." },
      { name: "Kinesis Video Streams", note: "Ingest and process video streams for playback/ML." },
      { name: "AWS X-Ray", note: "Distributed tracing to debug and analyze microservice latency." },
    ],
  },
];
