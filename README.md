# Render Deploy Action

An action to automate the render manual deploy. Before using this action turn off auto deployment from setting page of service, get the service id and service key from the deploy hook. [Refer](https://render.com/docs/deploy-hooks) And account api key from [Accounts Page](https://dashboard.render.com/u/settings). Store these secret in action secrets.

https://api.render.com/deploy/{SERVICE_ID}?key={SERVICE_KEY}

## Configuration

```yml
 - name: Deploy and wait
      uses: ashishkujoy/render-deploy@v0.0.1
      with:
        service-id: ${{ secrets.SERVICE_ID }}
        service-key: ${{ secrets.SERVICE_KEY }}
        api-key: ${{ secrets.API_KEY }}
        max-deployment-wait-ms: 360000
        delay-in-ms: 10000
```
