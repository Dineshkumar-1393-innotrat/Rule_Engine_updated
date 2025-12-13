import axios from 'axios';

const API_ROOT = 'https://eureka.innotrat.in/api/v1';

export const sanitizeSegment = (value) => {
  return (value || '')
    .toString()
    .trim()
    .replace(/[^a-zA-Z0-9-_]+/g, '-');
};

export const buildWorkspaceFileName = (projectName, kind, tabName) => {
  const projectSegment = sanitizeSegment(projectName);
  const kindSegment = sanitizeSegment(kind || 'workspace');
  const tabSegment = sanitizeSegment(tabName || 'tab');
  return `${projectSegment}_${kindSegment}_${tabSegment}.json`;
};

const ensureProjectFile = async ({ userId, projectId, fileName, existingFileId }) => {
  if (existingFileId) return existingFileId;
  const files = await fetchAllFiles(userId);
  const match = files.find((file) => file.parentId === projectId && file.name === fileName);
  if (match) return match._id;

  const response = await axios.post(`${API_ROOT}/createFileAndFolder`, {
    parentId: projectId,
    name: fileName,
    type: 'file',
    userId,
  });
  return response?.data?.file?._id || null;
};

const ensureProjectFolderInternal = async ({ userId, parentId, folderName }) => {
  if (!userId || !parentId || !folderName) return parentId;
  const sanitizedName = sanitizeSegment(folderName) || 'assets';
  const files = await fetchAllFiles(userId);
  const existing = files.find(
    (file) => file.parentId === parentId && file.type === 'folder' && file.name === sanitizedName
  );
  if (existing) return existing._id;

  try {
    const { data } = await axios.post(`${API_ROOT}/createFileAndFolder`, {
      parentId,
      name: sanitizedName,
      type: 'folder',
      userId,
    });
    return data?.file?._id || parentId;
  } catch (error) {
    console.error('Failed to ensure project folder', sanitizedName, error);
    return parentId;
  }
};

export const saveProjectFile = async ({
  userId,
  projectId,
  fileName,
  content,
  existingFileId,
}) => {
  if (!userId || !projectId || !fileName) {
    throw new Error('Missing identifiers when saving project file');
  }

  const fileId = await ensureProjectFile({ userId, projectId, fileName, existingFileId });
  if (!fileId) throw new Error('Unable to resolve project file for saving');

  await axios.put(`${API_ROOT}/updateFileAndFolder`, {
    fileId,
    newName: fileName,
    newContent: content,
  });

  return fileId;
};

const fetchAllFiles = async (userId) => {
  if (!userId) return [];
  try {
    const { data } = await axios.get(`${API_ROOT}/files/${userId}`);
    if (data?.success && Array.isArray(data.files)) {
      return data.files;
    }
  } catch (error) {
    console.error('Failed to fetch files', error);
  }
  return [];
};

export const loadWorkspaceSnapshots = async ({
  userId,
  projectId,
  projectName,
  kind,
}) => {
  if (!userId || !projectId) return [];
  const files = await fetchAllFiles(userId);
  const prefix = `${sanitizeSegment(projectName)}_${sanitizeSegment(kind || 'workspace')}_`;
  return files
    .filter((file) => file.parentId === projectId && file.name?.startsWith(prefix))
    .map((file) => {
      try {
        const parsed = typeof file.content === 'string' && file.content.trim().length
          ? JSON.parse(file.content)
          : null;
        const meta = parsed?.meta || {};
        return {
          fileId: file._id,
          fileName: file.name,
          tabName: meta.tabName || meta.name || file.name.replace(prefix, '').replace(/\.json$/i, ''),
          state: parsed?.state ?? null,
          updatedAt: file.updatedAt,
        };
      } catch (error) {
        console.warn('Failed to parse workspace file', file.name, error);
        return {
          fileId: file._id,
          fileName: file.name,
          tabName: file.name.replace(prefix, '').replace(/\.json$/i, ''),
          state: null,
          updatedAt: file.updatedAt,
        };
      }
    });
};

export const saveWorkspaceSnapshot = async ({
  userId,
  projectId,
  projectName,
  kind,
  tabName,
  state,
  existingFileId,
}) => {
  if (!userId || !projectId) {
    throw new Error('Missing user or project identifier for workspace save.');
  }

  const fileName = buildWorkspaceFileName(projectName, kind, tabName);
  const payload = {
    meta: {
      kind,
      tabName,
      projectName,
      updatedAt: new Date().toISOString(),
    },
    state,
  };

  const fileId = await saveProjectFile({
    userId,
    projectId,
    fileName,
    content: JSON.stringify(payload),
    existingFileId,
  });

  return {
    fileId,
    fileName,
  };
};

export const ensureProjectFolder = async ({ userId, projectId, folderName }) => {
  return ensureProjectFolderInternal({ userId, parentId: projectId, folderName });
};
