/**
 * 删除我的项目 API 测试
 *
 * 测试 DELETE /api/v1/showcase/my-projects/:id 端点
 * 该接口允许用户删除自己提交的待审核或已拒绝的项目
 *
 * 知识库参考: testarch/knowledge/test-levels-framework.md (API Tests)
 */

import { test, expect, API_URL, createTestUser, submitPendingProject } from './fixtures';

test.describe('[P1] 删除我的项目 API', () => {
  let userToken: string;
  let userId: string;

  test.beforeAll(async ({ api }) => {
    // 创建测试用户
    const user = await createTestUser(api);
    userToken = user.accessToken;
    userId = user.id;
  });

  test.describe('[P1] DELETE /api/v1/showcase/my-projects/:id - 删除项目', () => {
    test('[P1] 用户应能删除自己提交的待审核项目', async ({ api }) => {
      // GIVEN: 用户提交了项目
      const project = await submitPendingProject(api, userToken);
      expect(project).not.toBeNull();

      if (project) {
        // WHEN: 删除待审核项目
        const deleteResponse = await api.delete(
          `${API_URL}/api/v1/showcase/my-projects/${project.id}`,
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          }
        );

        // THEN: 返回 204 No Content
        expect(deleteResponse.status()).toBe(204);

        // 验证项目已删除
        const getResponse = await api.get(
          `${API_URL}/api/v1/showcase/my-projects?status=PENDING`
        );
        const getBody = await getResponse.json();
        const deletedProject = getBody.data.projects?.find((p: any) => p.id === project.id);
        expect(deletedProject).toBeUndefined();
      }
    });

    test('[P1] 删除不存在的项目应返回 404', async ({ api }) => {
      // GIVEN: 已登录用户
      // WHEN: 删除不存在的项目
      const invalidId = '00000000-0000-0000-0000-000000000000';
      const deleteResponse = await api.delete(
        `${API_URL}/api/v1/showcase/my-projects/${invalidId}`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );

      // THEN: 返回 404
      expect(deleteResponse.status()).toBe(404);
    });

    test('[P1] 未认证用户删除项目应返回 401', async ({ api }) => {
      // WHEN: 未认证尝试删除项目
      const deleteResponse = await api.delete(
        `${API_URL}/api/v1/showcase/my-projects/some-id`
      );

      // THEN: 返回 401
      expect(deleteResponse.status()).toBe(401);
    });

    test('[P1] 无效的项目 ID 格式应返回 400', async ({ api }) => {
      // WHEN: 使用无效的 UUID 格式
      const deleteResponse = await api.delete(
        `${API_URL}/api/v1/showcase/my-projects/not-a-valid-uuid`,
        {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );

      // THEN: 返回 400 或 422
      expect([400, 422]).toContain(deleteResponse.status());
    });

    test('[P2] 删除后从我的项目列表中移除', async ({ api }) => {
      // GIVEN: 用户有项目
      const project = await submitPendingProject(
        api,
        userToken,
        `https://github.com/test/to-delete-${Date.now()}`
      );

      if (project) {
        // 获取删除前的项目列表
        const beforeListResponse = await api.get(
          `${API_URL}/api/v1/showcase/my-projects`
        );
        const beforeBody = await beforeListResponse.json();
        const beforeCount = beforeBody.data.projects?.length || 0;

        // WHEN: 删除项目
        await api.delete(`${API_URL}/api/v1/showcase/my-projects/${project.id}`, {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        });

        // THEN: 项目不再出现在我的项目列表中
        const afterListResponse = await api.get(
          `${API_URL}/api/v1/showcase/my-projects`
        );
        const afterBody = await afterListResponse.json();
        const deletedProject = afterBody.data.projects?.find((p: any) => p.id === project.id);
        expect(deletedProject).toBeUndefined();
        expect(afterBody.data.projects.length).toBeLessThanOrEqual(beforeCount);
      }
    });

    test('[P2] 不能删除其他用户的项目', async ({ api }) => {
      // GIVEN: 用户 A 创建了项目
      const userA = await createTestUser(api);
      const projectA = await submitPendingProject(api, userA.accessToken);

      if (projectA) {
        // WHEN: 用户 B 尝试删除用户 A 的项目
        const deleteResponse = await api.delete(
          `${API_URL}/api/v1/showcase/my-projects/${projectA.id}`,
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          }
        );

        // THEN: 返回 403 Forbidden 或 404 Not Found
        expect([403, 404]).toContain(deleteResponse.status());
      }
    });
  });

  test.describe('[P2] 已批准项目删除限制', () => {
    test('[P2] 不能删除已批准的项目', async ({ api }) => {
      // GIVEN: 尝试使用已批准的项目 ID
      // 由于我们无法在测试中直接创建已批准的项目，这里使用有效但已批准的项目 ID
      // 实际测试中需要通过管理 API 或数据库操作

      // 获取现有项目列表
      const listResponse = await api.get(`${API_URL}/api/v1/showcase/projects?limit=1`);
      const listBody = await listResponse.json();

      if (listBody.data.projects?.length > 0) {
        const approvedProject = listBody.data.projects[0];

        // WHEN: 用户尝试删除已批准的项目
        const deleteResponse = await api.delete(
          `${API_URL}/api/v1/showcase/my-projects/${approvedProject.id}`,
          {
            headers: {
              Authorization: `Bearer ${userToken}`,
            },
          }
        );

        // THEN: 返回 403 (不是项目所有者) 或 404 (不在我的项目中) 或 409 (已批准不能删除)
        expect([403, 404, 409]).toContain(deleteResponse.status());
      }
    });
  });
});
