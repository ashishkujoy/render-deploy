const core = require('@actions/core');
const github = require('@actions/github');
const { triggerDeployment, checkDeploymentStatus } = require("./render");

const wait = (duration) => new Promise((res, _) => {
  setTimeout(() => res(duration), duration);
});

const repeatWithDelay = async (task, delay) => {
  return task()
    .then(shouldConitune => {
      if (shouldConitune) {
        return wait(delay).then(_ => repeatWithDelay(task, delay))
      }
      return Promise.resolve();
    });
};

const getConfig = () => {
  const serviceId = core.getInput('service-id');
  const serviceKey = core.getInput('service-key');
  const apiKey = core.getInput('api-key');
  const maxDurationInMs = core.getInput('max-deployment-wait-ms');
  const delay = core.getInput('delay-in-ms');

  return {
    serviceId, serviceKey, apiKey, maxDurationInMs, delay
  };
}

const jobCompletionStatus = ['live', 'deactivated', 'build_failed', 'update_failed', 'canceled']

const handleDeploymentStatus = (status) => {
  if (!jobCompletionStatus.includes(status)) {
    return { shouldConitune: true };
  }

  if (status !== 'live') {
    core.setFailed(`Failed to deploy, deployment status: ${status}`);
  }

  return { shouldContinue: false };
}

const awaitDeployment = async (config, deploymentId) => {
  const startedAt = new Date().getTime();
  core.startGroup('Deployment Status');

  repeatWithDelay(async () => {
    const currentTime = new Date().getTime();
    if ((currentTime - startedAt) > config.maxDurationInMs) {
      core.setFailed(`Unable to verify deployment is live in ${config.maxDurationInMs} milliseconds`);
      return false;
    }
    const deploymentStatus = await checkDeploymentStatus(config.serviceId, deploymentId, config.apiKey);
    core.info(`${new Date()} Deployment Status: ${deploymentStatus.status}`);
    return handleDeploymentStatus(deploymentStatus.status).shouldConitune;
  }, config.delay);

  core.endGroup('Deployment Status');
}

const logCommitDetails = (commitDetails) => {
  const headCommit = commitDetails.head_commit;

  core.startGroup('Deployment Details');
  core.info(`Id: ${headCommit.id} , Message: ${headCommit.message}`);

  core.startGroup('All Commit deployed');
  commitDetails.commits.forEach(commit => {
    core.info(`Id: ${commit.id} , Message: ${commit.message}`);
  });
  core.endGroup('All Commit deployed');

  core.endGroup('Deployment Details');
};

const deployAndVerifyStatus = async () => {
  try {
    const config = getConfig();
    const { id } = github.context.payload.head_commit;
    logCommitDetails(github.context.payload);

    const deploymentId = await triggerDeployment(config.serviceId, config.serviceKey, id);
    core.info('Deployment Id: ' + deploymentId);

    await awaitDeployment(config, deploymentId);

  } catch (error) {
    core.setFailed(error.message);
  }
}

deployAndVerifyStatus();
