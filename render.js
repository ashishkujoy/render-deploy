const rejectErrorResponse = res => {
  if(res.status >= 400) {
    console.error('Status:', res.status);
    console.error('Headers:', JSON.stringify(res.headers, null, 2));
    return Promise.reject(res);
  }
  return Promise.resolve(res);
};

const extractBody = res => res.json();

const triggerDeployment = (serviceId, serviceKey, commitSha) => {
  const deployHookUrl = `https://api.render.com/deploy/${serviceId}?key=${serviceKey}&ref=${commitSha}`;
  console.log(deployHookUrl);
  return fetch(`${deployHookUrl}&ref=${commitSha}`, {
    headers: {
      'accept': 'application/json'
    }
  })
    .then(rejectErrorResponse)
    .then(extractBody)
    .then(body => body.deploy.id)
    .catch(console.error);
};

const checkDeploymentStatus = (serviceId, deploymentId, apiKey) => {
  const deploymentUrl = `https://api.render.com/v1/services/${serviceId}/deploys/${deploymentId}`
  return fetch(deploymentUrl, {
    headers: {
      'accept': 'application/json',
      'authorization': `Bearer ${apiKey}`
    }
  })
    .then(rejectErrorResponse)
    .then(extractBody);
};

module.exports = { triggerDeployment, checkDeploymentStatus };
