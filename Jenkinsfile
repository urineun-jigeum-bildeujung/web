// 코드 품질 검증(typecheck/lint/test/e2e)은 GitHub Actions(ci.yml)가 PR 단계에서
// 이미 게이트로 걸고 있음 — dev로 오는 push는 그 검증을 통과한 것만 들어온다.
// 이 파이프라인은 컨테이너화(빌드/스캔/배포)만 담당한다. sever/Jenkinsfile과 같은
// 원칙(빌드 -> Trivy CRITICAL 스캔 -> 통과한 이미지만 push)을 따르되, 서비스가
// 하나뿐이라 detect-services.sh 같은 다중 서비스 분기는 없다.
def imageTag = ''
def isRealDeploy = false

pipeline {
    options {
        disableConcurrentBuilds()
    }

    // sever와 동일하게 Kubernetes 동적 agent Pod. gradle 컨테이너는 필요 없음 —
    // npm build는 Dockerfile의 builder 스테이지 안에서 kaniko가 직접 수행한다
    // (모노레포 7서비스처럼 무거운 빌드가 아니라 굳이 kaniko 밖에서 미리 빌드해둘
    // 이유가 없음).
    agent {
        kubernetes {
            yaml """
apiVersion: v1
kind: Pod
spec:
  serviceAccountName: jenkins-kaniko
  containers:
    - name: kaniko
      image: gcr.io/kaniko-project/executor:debug
      command:
        - /busybox/cat
      tty: true
      resources:
        requests:
          cpu: 50m
          memory: 128Mi
          ephemeral-storage: 512Mi
        limits:
          cpu: "2"
          memory: 2Gi
          ephemeral-storage: 3Gi
    - name: trivy
      image: aquasec/trivy:0.74.0
      command:
        - sleep
      args:
        - 99d
      resources:
        requests:
          cpu: 30m
          memory: 128Mi
          ephemeral-storage: 512Mi
        limits:
          cpu: "1"
          memory: 1Gi
          ephemeral-storage: 3Gi
    - name: crane
      image: gcr.io/go-containerregistry/crane:debug
      command:
        - sleep
      args:
        - 99d
      resources:
        requests:
          cpu: 20m
          memory: 32Mi
          ephemeral-storage: 128Mi
        limits:
          cpu: 500m
          memory: 256Mi
          ephemeral-storage: 512Mi
    - name: awscli
      image: amazon/aws-cli:2.29.0
      command:
        - sleep
      args:
        - 99d
      resources:
        requests:
          cpu: 20m
          memory: 64Mi
          ephemeral-storage: 128Mi
        limits:
          cpu: 500m
          memory: 256Mi
          ephemeral-storage: 256Mi
      volumeMounts:
      - mountPath: "/home/jenkins/agent"
        name: "workspace-volume"
        readOnly: false
"""
        }
    }

    environment {
        IMAGE_REGISTRY = '297165773875.dkr.ecr.ap-northeast-2.amazonaws.com/petflow'
    }

    stages {
        stage('Prepare') {
            steps {
                script {
                    imageTag = sh(script: 'git rev-parse HEAD', returnStdout: true).trim()

                    // sever/Jenkinsfile과 동일한 이유 — 사람이 수동으로 "Build Now" 누른
                    // 빌드는 실배포에서 제외해서 재실행이 실수로 ECR push/GitOps 갱신으로
                    // 이어지지 않게 한다.
                    def isManualTrigger = !currentBuild.getBuildCauses('hudson.model.Cause$UserIdCause').isEmpty()
                    isRealDeploy = (env.CHANGE_ID == null) && (env.BRANCH_NAME == 'dev') && !isManualTrigger

                    echo "실배포 여부: ${isRealDeploy}"
                }
            }
        }

        stage('Build & Scan') {
            steps {
                script {
                    def tarFile = 'web.tar'
                    def imageRef = "${env.IMAGE_REGISTRY}/web:${imageTag}"

                    container('kaniko') {
                        sh """
                            /kaniko/executor \\
                              --context=`pwd` \\
                              --dockerfile=Dockerfile \\
                              --destination=${imageRef} \\
                              --no-push \\
                              --tarPath=${tarFile}
                        """
                    }

                    container('trivy') {
                        sh """
                            trivy image --input ${tarFile} \\
                              --severity CRITICAL --exit-code 1 --ignore-unfixed
                        """
                    }

                    if (isRealDeploy) {
                        container('awscli') {
                            sh "aws ecr get-login-password --region ap-northeast-2 > ecr-token.txt"
                        }
                        container('crane') {
                            sh """
                                crane auth login ${env.IMAGE_REGISTRY.split('/')[0]} --username AWS --password-stdin < ecr-token.txt
                                crane push ${tarFile} ${imageRef}
                            """
                        }
                        sh "rm -f ecr-token.txt"
                    }

                    sh "rm -f ${tarFile}"
                }
            }
        }

        stage('Update GitOps') {
            when {
                expression { return isRealDeploy }
            }
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: 'gitops-value-push',
                        usernameVariable: 'GIT_USER',
                        passwordVariable: 'GIT_TOKEN'
                    )]) {
                        sh """
                            rm -rf gitops-value-checkout
                            git clone https://\${GIT_USER}:\${GIT_TOKEN}@github.com/urineun-jigeum-bildeujung/gitops-value.git gitops-value-checkout
                        """
                    }

                    sh '''
                        curl -sL https://github.com/mikefarah/yq/releases/download/v4.44.3/yq_linux_amd64 -o /tmp/yq
                        chmod +x /tmp/yq
                    '''

                    sh """
                        /tmp/yq -i '.image.tag = "${imageTag}"' gitops-value-checkout/values/dev/services/web/values.yaml
                    """

                    dir('gitops-value-checkout') {
                        sh """
                            git config user.email 'jenkins@petflow.local'
                            git config user.name 'jenkins-ci'
                            git add values/
                            git diff --cached --quiet && echo '변경 없음, commit 생략' || git commit -m 'chore: deploy web @ ${imageTag}'
                            git push
                        """
                    }
                }
            }
        }
    }
}
