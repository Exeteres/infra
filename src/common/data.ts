interface NodeDescriptor {
  name: string
  nodeSelector: Record<string, string>
}

function createNode(name: string): NodeDescriptor {
  return {
    name,
    nodeSelector: { "kubernetes.io/hostname": name },
  }
}

const publicSpb = createNode("public-spb")
const publicNsk = createNode("public-nsk")
const publicAms = createNode("public-ams")

export const nodes = {
  publicSpb,
  publicNsk,
  publicAms,

  master: publicSpb,
}

export const storageClasses = {
  local: "local-path",
  encrypted: "encrypted",
  encryptedLocal: "encrypted-local",
}
