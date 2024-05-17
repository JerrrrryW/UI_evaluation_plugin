// 显示插件的 UI 界面
figma.showUI(__html__, { width: 450, height: 1200 });

// 递归获取所有子元素的信息和预览图，计算绝对坐标
async function getNodeInfo(node: SceneNode, parentAbsoluteX: number = 0, parentAbsoluteY: number = 0): Promise<any> {
  const baseInfo: any = {
    id: node.id,
    name: node.name,
    type: node.type,
  };

  // 获取节点的宽度和高度（如果有）
  if ('width' in node && 'height' in node) {
    baseInfo.width = (node as GeometryMixin).width;
    baseInfo.height = (node as GeometryMixin).height;
  }

  // 获取节点的相对坐标并计算绝对坐标
  let absoluteX = parentAbsoluteX;
  let absoluteY = parentAbsoluteY;

  if ('x' in node && 'y' in node) {
    absoluteX += (node as LayoutMixin).x;
    absoluteY += (node as LayoutMixin).y;
  }

  baseInfo.x = absoluteX;
  baseInfo.y = absoluteY;

  // 获取节点的预览图
  const exportSettings = {
    format: 'PNG',
    constraint: { type: 'SCALE', value: 2 }
  };
  const imageBytes = await node.exportAsync(exportSettings);
  const imageDataUrl = `data:image/png;base64,${figma.base64Encode(imageBytes)}`;
  baseInfo.preview = imageDataUrl;

  // 获取子元素的信息
  if ('children' in node) {
    baseInfo.children = await Promise.all(node.children.map(child => getNodeInfo(child, absoluteX, absoluteY)));
  }

  return baseInfo;
}

// 监听从 UI 发来的消息
figma.ui.onmessage = async (msg: { type: string }) => {
  if (msg.type === 'get-selection') {
    // 获取当前选中的所有节点
    const selection = figma.currentPage.selection;

    // 提取每个选中节点及其子节点的信息
    const selectionInfo = await Promise.all(selection.map(node => getNodeInfo(node)));

    // 将选中节点的信息发送回 UI
    figma.ui.postMessage({ type: 'selection-info', data: selectionInfo });
  }

  // figma.closePlugin();
};