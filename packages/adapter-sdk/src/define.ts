import type {
  ProjectComponentDescriptor,
  ProjectNodeTypeDescriptor,
  ProjectPropertyDescriptor,
  WorldformProjectAdapter,
} from '@worldform/adapter-api'

/** 保留具体 Adapter 类型的定义辅助，便于第三方项目获得完整类型推断。 */
export function defineProjectAdapter<TAdapter extends WorldformProjectAdapter>(
  adapter: TAdapter,
): TAdapter {
  return adapter
}

export function defineNodeType<TDescriptor extends ProjectNodeTypeDescriptor>(
  descriptor: TDescriptor,
): TDescriptor {
  return descriptor
}

export function defineComponent<TDescriptor extends ProjectComponentDescriptor>(
  descriptor: TDescriptor,
): TDescriptor {
  return descriptor
}

export function defineProperty<TDescriptor extends ProjectPropertyDescriptor>(
  descriptor: TDescriptor,
): TDescriptor {
  return descriptor
}
