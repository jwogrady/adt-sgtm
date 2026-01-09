variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "region" {
  description = "GCP region for Cloud Run"
  type        = string
  default     = "us-central1"
}

variable "image" {
  description = "Container image to deploy"
  type        = string
  default     = "gcr.io/PROJECT_ID/sgtm-proxy:latest"
}

variable "upstream_host" {
  description = "Server-side GTM upstream host"
  type        = string
}

variable "custom_domain" {
  description = "Custom domain for the proxy (optional)"
  type        = string
  default     = ""
}
