resource "twc_firewall" "firewall" {
  name = "main"

  dynamic "link" {
    for_each = toset(var.server_ids)

    content {
      id   = link.value
      type = "server"
    }
  }
}

resource "twc_firewall_rule" "allow_ssh" {
  firewall_id = twc_firewall.firewall.id
  description = "Allow SSH"

  direction = "ingress"
  protocol  = "tcp"
  port      = var.ssh_port
}

resource "twc_firewall_rule" "allow_bootstrap_ssh" {
  firewall_id = twc_firewall.firewall.id
  description = "Allow SSH while bootstrapping"

  direction = "ingress"
  protocol  = "tcp"
  port      = 22
}

resource "twc_firewall_rule" "allow_kubernetes" {
  firewall_id = twc_firewall.firewall.id
  description = "Allow Kubernetes API"

  direction = "ingress"
  protocol  = "tcp"
  port      = 6443
}

resource "twc_firewall_rule" "allow_https" {
  for_each = toset(var.cloudflare_ip_ranges)

  firewall_id = twc_firewall.firewall.id
  description = "Allow HTTPS from Cloudflare (${each.key})"

  direction = "ingress"
  protocol  = "tcp"
  port      = 443

  cidr = each.value
}
