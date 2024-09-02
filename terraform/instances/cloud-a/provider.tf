terraform {
  required_providers {
    yandex = {
      source = "yandex-cloud/yandex"
    }
  }
}

provider "yandex" {
  zone                     = var.zone
  folder_id                = var.folder_id
  service_account_key_file = var.yc_sa_key
}
